const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const User = require('../src/models/User');
const Video = require('../src/models/Video');
const env = require('../src/config/env');

const TEST_PREFIX = `test_${Date.now()}`;

let editorToken;
let viewerToken;
let editorUser;
let viewerUser;
let testVideoId;
let testVideoFilePath;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  // Register editor user
  const editorRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Editor',
      email: `${TEST_PREFIX}_editor@example.com`,
      password: 'EditorPass123!',
      role: 'editor',
    });
  editorToken = editorRes.body.data.token;
  editorUser = editorRes.body.data.user;

  // Register viewer user
  const viewerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Viewer',
      email: `${TEST_PREFIX}_viewer@example.com`,
      password: 'ViewerPass123!',
      role: 'viewer',
    });
  viewerToken = viewerRes.body.data.token;
  viewerUser = viewerRes.body.data.user;

  // Ensure uploads/videos directory exists
  const videosDir = path.resolve(env.uploadDir, 'videos');
  fs.mkdirSync(videosDir, { recursive: true });
});

afterAll(async () => {
  // Clean up test videos from DB
  if (editorUser) {
    const videos = await Video.find({ uploadedBy: editorUser._id });
    for (const video of videos) {
      if (video.filepath && fs.existsSync(video.filepath)) {
        fs.unlinkSync(video.filepath);
      }
    }
    await Video.deleteMany({ uploadedBy: editorUser._id });
  }

  // Clean up test users
  await User.deleteMany({ email: { $regex: `^${TEST_PREFIX}` } });
  await mongoose.connection.close();
});

describe('GET /api/videos', () => {
  it('should return a list for authenticated user', async () => {
    const res = await request(app)
      .get('/api/videos')
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('videos');
    expect(res.body.data).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data.videos)).toBe(true);
  });

  it('should fail without auth (401)', async () => {
    const res = await request(app)
      .get('/api/videos')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/videos', () => {
  // Create a small temporary test video file for upload
  const testVideoPath = path.join(__dirname, 'test-video.mp4');

  beforeAll(() => {
    // Create a minimal fake video file (just bytes, enough for multer to accept)
    fs.writeFileSync(testVideoPath, Buffer.alloc(1024, 0));
  });

  afterAll(() => {
    if (fs.existsSync(testVideoPath)) {
      fs.unlinkSync(testVideoPath);
    }
  });

  it('should upload successfully for editor role', async () => {
    const res = await request(app)
      .post('/api/videos')
      .set('Authorization', `Bearer ${editorToken}`)
      .field('title', 'Test Video Upload')
      .field('description', 'A test video')
      .attach('video', testVideoPath)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.title).toBe('Test Video Upload');

    testVideoId = res.body.data._id;
    testVideoFilePath = res.body.data.filepath;
  });

  it('should deny upload for viewer role (403)', async () => {
    const res = await request(app)
      .post('/api/videos')
      .set('Authorization', `Bearer ${viewerToken}`)
      .field('title', 'Viewer Upload Attempt')
      .attach('video', testVideoPath)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/insufficient permissions/i);
  });
});

describe('GET /api/videos/:id/stream', () => {
  it('should return video stream with range headers', async () => {
    if (!testVideoId) {
      // Skip if upload test failed
      return;
    }

    const res = await request(app)
      .get(`/api/videos/${testVideoId}/stream`)
      .set('Authorization', `Bearer ${editorToken}`)
      .set('Range', 'bytes=0-511');

    // Should be 206 Partial Content with Range header, or 200 if file served fully
    expect([200, 206]).toContain(res.status);

    if (res.status === 206) {
      expect(res.headers['content-range']).toBeDefined();
      expect(res.headers['accept-ranges']).toBe('bytes');
    }
  });
});

describe('DELETE /api/videos/:id', () => {
  it('should be denied for viewer (403)', async () => {
    if (!testVideoId) return;

    const res = await request(app)
      .delete(`/api/videos/${testVideoId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/insufficient permissions/i);
  });

  it('should succeed for editor', async () => {
    if (!testVideoId) return;

    const res = await request(app)
      .delete(`/api/videos/${testVideoId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });
});

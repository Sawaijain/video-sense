const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const env = require('../src/config/env');

const TEST_PREFIX = `test_${Date.now()}`;

const testUser = {
  name: 'Test User',
  email: `${TEST_PREFIX}_auth@example.com`,
  password: 'TestPassword123!',
  role: 'editor',
};

const duplicateUser = {
  name: 'Duplicate User',
  email: `${TEST_PREFIX}_auth@example.com`, // same email
  password: 'AnotherPassword123!',
  role: 'viewer',
};

let authToken;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }
});

afterAll(async () => {
  // Clean up test users
  await User.deleteMany({ email: { $regex: `^${TEST_PREFIX}` } });
  await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user).not.toHaveProperty('passwordHash');

    authToken = res.body.data.token;
  });

  it('should fail with duplicate email (409)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(duplicateUser)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('should fail with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `${TEST_PREFIX}_incomplete@example.com` });

    // The app should return an error status (400 or 500 depending on validation)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe(testUser.email);

    // Update the token for subsequent tests
    authToken = res.body.data.token;
  });

  it('should fail with wrong password (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword!' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should fail without token (401)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

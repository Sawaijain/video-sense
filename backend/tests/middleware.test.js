const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');

// We test the middleware functions by calling them with mock req/res/next objects.
const authMiddleware = require('../src/middleware/auth');
const rbac = require('../src/middleware/rbac');
const tenancy = require('../src/middleware/tenancy');

const TEST_PREFIX = `test_${Date.now()}`;

let testUser;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  // Create a test user directly in the DB
  testUser = await User.create({
    name: 'Middleware Test User',
    email: `${TEST_PREFIX}_middleware@example.com`,
    passwordHash: 'MiddlewarePass123!',
    role: 'editor',
  });
});

afterAll(async () => {
  await User.deleteMany({ email: { $regex: `^${TEST_PREFIX}` } });
  await mongoose.connection.close();
});

// Helper to create mock Express objects
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Middleware', () => {
  it('should populate req.user with a valid JWT', async () => {
    const token = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
      query: {},
    };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // next should be called with no arguments (no error)
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(testUser._id.toString());
  });

  it('should call next with 401 error for missing token', async () => {
    const req = {
      headers: {},
      query: {},
    };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
  });

  it('should call next with 401 error for invalid token', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token-here' },
      query: {},
    };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
  });

  it('should accept token from query param', async () => {
    const token = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    const req = {
      headers: {},
      query: { token },
    };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.user).toBeDefined();
  });
});

describe('RBAC Middleware', () => {
  it('should allow a user with the correct role', () => {
    const middleware = rbac('editor', 'admin');
    const req = { user: { role: 'editor' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('should block a user with the wrong role', () => {
    const middleware = rbac('editor', 'admin');
    const req = { user: { role: 'viewer' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it('should return 401 if no user on request', () => {
    const middleware = rbac('editor');
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
  });
});

describe('Tenancy Middleware', () => {
  it('should set empty filter for admin user', () => {
    const req = { user: { _id: new mongoose.Types.ObjectId(), role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    tenancy(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.tenantFilter).toEqual({});
  });

  it('should set uploadedBy filter for non-admin user', () => {
    const userId = new mongoose.Types.ObjectId();
    const req = { user: { _id: userId, role: 'editor' } };
    const res = mockRes();
    const next = jest.fn();

    tenancy(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.tenantFilter).toEqual({ uploadedBy: userId });
  });

  it('should set uploadedBy filter for viewer', () => {
    const userId = new mongoose.Types.ObjectId();
    const req = { user: { _id: userId, role: 'viewer' } };
    const res = mockRes();
    const next = jest.fn();

    tenancy(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.tenantFilter).toEqual({ uploadedBy: userId });
  });

  it('should call next without setting filter if no user', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    tenancy(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.tenantFilter).toBeUndefined();
  });
});

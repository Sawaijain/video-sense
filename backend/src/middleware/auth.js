const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const auth = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback to query param (for video streaming)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) throw new ApiError(401, 'User not found');
    if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    next(error);
  }
};

module.exports = auth;

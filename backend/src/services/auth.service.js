const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    role: role || 'viewer',
  });

  const token = signToken(user);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const token = signToken(user);
  return { user, token };
};

module.exports = { register, login, signToken };

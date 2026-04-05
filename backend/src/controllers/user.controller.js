const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['viewer', 'editor', 'admin'].includes(role)) {
      throw new ApiError(400, 'Invalid role');
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const toggleActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, updateRole, toggleActive };

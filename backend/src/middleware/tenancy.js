const tenancy = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  // Admin can see everything
  if (req.user.role === 'admin') {
    req.tenantFilter = {};
  } else {
    req.tenantFilter = { uploadedBy: req.user._id };
  }
  next();
};

module.exports = tenancy;

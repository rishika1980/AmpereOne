const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
      .populate('flatId')
      .populate('societyId')
      .populate('builderId')
      .select('-password');

    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const isFlatOwner = (req, res, next) => {
  if (req.user?.role === 'flat_owner') return next();
  return res.status(403).json({ success: false, message: 'Flat owner access required' });
};

const isSocietyAdmin = (req, res, next) => {
  if (req.user?.role === 'society_admin') return next();
  return res.status(403).json({ success: false, message: 'Society admin access required' });
};

const isBuilderAdmin = (req, res, next) => {
  if (req.user?.role === 'builder_admin') return next();
  return res.status(403).json({ success: false, message: 'Builder admin access required' });
};

const isAdminOrBuilder = (req, res, next) => {
  if (['society_admin', 'builder_admin'].includes(req.user?.role)) return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

module.exports = { protect, isFlatOwner, isSocietyAdmin, isBuilderAdmin, isAdminOrBuilder };

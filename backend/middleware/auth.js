const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    } else if (decoded.role === 'faculty') {
      user = await Faculty.findById(decoded.id).select('-password');
    } else if (decoded.role === 'student') {
      user = await Student.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.userRole}' is not permitted.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };

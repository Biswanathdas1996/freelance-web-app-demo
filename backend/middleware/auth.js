const jwt = require('jsonwebtoken');
const User = require('../models/User');

function requireAuth() {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = header.slice(7);
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select('-passwordHash');
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not allowed for your role' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };

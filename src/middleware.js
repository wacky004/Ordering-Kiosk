'use strict';

const { db } = require('./db');

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  req.user = user;
  next();
}

/** RBAC: allow only the given roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'You do not have access to this resource.' });
      }
      next();
    });
  };
}

const STAFF_ROLES = ['kitchen', 'cashier', 'manager', 'admin'];

module.exports = { requireAuth, requireRole, requireAdmin: requireRole('admin'), STAFF_ROLES };

const { error } = require('../utils/response');
const { ROLES } = require('../config/constants');

/**
 * Must run AFTER `protect`. Restricts access to users with role ADMIN.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return error(res, 403, 'Access denied: admin privileges required');
  }
  next();
};

module.exports = { adminOnly };

const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const User = require('../models/User');

/**
 * Protects routes by requiring a valid JWT in the Authorization header.
 * Attaches the authenticated user's document (minus password) to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 401, 'Not authorized, no token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return error(res, 401, 'Not authorized, user no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, 'Session expired, please log in again');
    }
    return error(res, 401, 'Not authorized, invalid token');
  }
};

module.exports = { protect };

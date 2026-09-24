const { error } = require('../utils/response');

/**
 * Catches requests to routes that don't exist.
 */
const notFound = (req, res, next) => {
  error(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

/**
 * Centralized error handler. Normalizes known Sequelize/JWT error types
 * into clean, safe JSON responses and never leaks stack traces or
 * internal details to the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  // Sequelize validation error (model-level `validate` rules)
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return error(res, 400, messages.join('; '));
  }

  // Sequelize unique constraint violation (e.g. unique email / vehicleNumber / slotNumber)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return error(res, 409, `Duplicate value for ${field}, must be unique`);
  }

  // Sequelize foreign key constraint violation (e.g. referencing a deleted parent row)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, 400, 'Invalid reference to a related record');
  }

  // Any other database-level error (bad SQL, connection drop mid-query, etc.)
  if (err.name === 'SequelizeDatabaseError') {
    return error(res, 400, 'Invalid request data');
  }

  // JWT errors that slip through (defensive; authMiddleware also handles these)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return error(res, 401, 'Not authorized, invalid or expired token');
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  return error(res, statusCode, message);
};

module.exports = { notFound, errorHandler };

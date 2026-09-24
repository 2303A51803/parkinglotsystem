/**
 * Typed application error carrying an HTTP status code, so services can
 * throw domain errors (e.g. "slot unavailable" -> 409) that the central
 * errorMiddleware translates directly into a clean JSON response.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

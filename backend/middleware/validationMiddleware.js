const { body, validationResult } = require('express-validator');
const { error } = require('../utils/response');
const { VEHICLE_TYPES, FUEL_TYPES } = require('../config/constants');

/**
 * Runs after a chain of express-validator checks; if any failed,
 * responds with a clean 400 instead of letting the request proceed.
 * Backend validation is authoritative — never trust frontend checks alone.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result
      .array()
      .map((e) => e.msg)
      .join('; ');
    return error(res, 400, message);
  }
  next();
};

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const vehicleValidation = [
  body('vehicleNumber')
    .trim()
    .matches(/^[A-Za-z0-9\- ]{4,15}$/)
    .withMessage('Vehicle number must be 4-15 alphanumeric characters'),
  body('vehicleType')
    .isIn(VEHICLE_TYPES)
    .withMessage(`Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`),
  body('fuelType')
    .isIn(FUEL_TYPES)
    .withMessage(`Fuel type must be one of: ${FUEL_TYPES.join(', ')}`),
];

const bookingValidation = [
  body('vehicleId').isInt({ min: 1 }).withMessage('Valid vehicleId is required'),
  body('parkingSlotId').isInt({ min: 1 }).withMessage('Valid parkingSlotId is required'),
  body('startTime').isISO8601().withMessage('startTime must be a valid ISO date'),
  body('expectedEndTime').isISO8601().withMessage('expectedEndTime must be a valid ISO date'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  vehicleValidation,
  bookingValidation,
};

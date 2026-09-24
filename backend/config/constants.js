/**
 * Centralized, configurable business rules.
 * Keeping these here (instead of hard-coding inside services) means
 * pricing tiers / grace periods / weights can be tuned without touching logic.
 */

module.exports = {
  ROLES: {
    USER: 'USER',
    ADMIN: 'ADMIN',
  },

  VEHICLE_TYPES: ['BIKE', 'CAR', 'SUV', 'EV'],
  FUEL_TYPES: ['PETROL', 'DIESEL', 'ELECTRIC', 'CNG', 'HYBRID'],

  SLOT_STATUS: {
    AVAILABLE: 'AVAILABLE',
    BOOKED: 'BOOKED',
    OCCUPIED: 'OCCUPIED',
    MAINTENANCE: 'MAINTENANCE',
  },

  CHARGER_STATUS: {
    AVAILABLE: 'AVAILABLE',
    IN_USE: 'IN_USE',
    NONE: 'NONE',
  },

  BOOKING_STATUS: {
    BOOKED: 'BOOKED',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
  },

  PAYMENT_STATUS: {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
  },

  // Reservation expiry
  BOOKING_GRACE_PERIOD_MINUTES: Number(process.env.BOOKING_GRACE_PERIOD_MINUTES) || 15,

  // Fee rounding: "rounded" bills full hours rounded up, "exact" bills to the minute
  FEE_ROUNDING_MODE: process.env.FEE_ROUNDING_MODE || 'rounded',
  MINIMUM_BILLABLE_MINUTES: 30,

  // Dynamic pricing tiers (occupancy % -> price per hour in INR)
  PRICING_TIERS: [
    { maxOccupancy: 50, pricePerHour: 30, demandLevel: 'LOW' },
    { maxOccupancy: 80, pricePerHour: 40, demandLevel: 'MODERATE' },
    { maxOccupancy: 100, pricePerHour: 60, demandLevel: 'HIGH' },
  ],

  // Smart recommendation scoring weights (must sum to 1.0)
  RECOMMENDATION_WEIGHTS: {
    distance: 0.40,
    price: 0.20,
    vehicleCompatibility: 0.25,
    availability: 0.15,
  },

  RECOMMENDATION_RESULT_LIMIT: 5,
};

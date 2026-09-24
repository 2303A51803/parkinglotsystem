const { FEE_ROUNDING_MODE, MINIMUM_BILLABLE_MINUTES } = require('../config/constants');

/**
 * Calculates billable duration in hours between actual entry and exit.
 * Mode is configurable (spec section 15):
 *  - "rounded": any partial hour is billed as a full hour (industry-standard for parking)
 *  - "exact": billed to the fractional hour based on actual minutes parked
 * A minimum billable duration prevents a near-zero-minute stay from being free.
 */
const calculateDurationHours = (entryTime, exitTime) => {
  const minutes = Math.max(
    MINIMUM_BILLABLE_MINUTES,
    Math.round((new Date(exitTime) - new Date(entryTime)) / 60000)
  );

  if (FEE_ROUNDING_MODE === 'exact') {
    return Math.round((minutes / 60) * 100) / 100;
  }

  // rounded: ceil to next full hour
  return Math.ceil(minutes / 60);
};

/**
 * Calculates the total parking fee given entry/exit timestamps and the
 * dynamic price-per-hour locked in at booking time.
 */
const calculateFee = (entryTime, exitTime, dynamicPricePerHour) => {
  const durationHours = calculateDurationHours(entryTime, exitTime);
  const totalAmount = Math.round(durationHours * dynamicPricePerHour * 100) / 100;

  return { durationHours, totalAmount };
};

module.exports = { calculateDurationHours, calculateFee };

const { Op } = require('sequelize');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingHistory = require('../models/ParkingHistory');
const { SLOT_STATUS } = require('../config/constants');
const { getTierForOccupancy } = require('./pricingService');

/**
 * OCCUPANCY PREDICTION
 * --------------------
 * v1 implementation (spec section 20): average of historical occupancy
 * readings for the same day-of-week + hour. No ML required yet.
 *
 * Structured so a future ML model can be dropped in behind the same
 * `predictOccupancy(targetDate)` interface without touching callers —
 * swap the body of `predictFromHistory` for a model inference call.
 */

/**
 * Takes a lot-wide occupancy reading (aggregate snapshot, parkingSlotId = null)
 * and stores it in ParkingHistory. Called hourly by the cron scheduler.
 */
const snapshotOccupancy = async () => {
  const [totalSlots, occupiedCount, availableCount] = await Promise.all([
    ParkingSlot.count(),
    ParkingSlot.count({ where: { status: { [Op.in]: [SLOT_STATUS.BOOKED, SLOT_STATUS.OCCUPIED] } } }),
    ParkingSlot.count({ where: { status: SLOT_STATUS.AVAILABLE } }),
  ]);

  const now = new Date();
  const occupancyPercentage = totalSlots === 0 ? 0 : Math.round((occupiedCount / totalSlots) * 10000) / 100;

  const entry = await ParkingHistory.create({
    parkingSlotId: null,
    date: now,
    dayOfWeek: now.getDay(),
    hour: now.getHours(),
    occupiedCount,
    availableCount,
    totalSlots,
    occupancyPercentage,
  });

  return entry;
};

/**
 * Historical-average prediction for a given target date/time.
 * Looks at all aggregate ParkingHistory snapshots recorded for the same
 * day-of-week and hour, and averages their occupancy percentage.
 * Falls back to current occupancy if there isn't enough history yet.
 */
const predictFromHistory = async (targetDate) => {
  const dayOfWeek = targetDate.getDay();
  const hour = targetDate.getHours();

  const matches = await ParkingHistory.findAll({
    where: { parkingSlotId: null, dayOfWeek, hour },
  });

  if (matches.length === 0) {
    return { predictedOccupancy: null, sampleSize: 0 };
  }

  const avg = matches.reduce((sum, m) => sum + m.occupancyPercentage, 0) / matches.length;

  return { predictedOccupancy: Math.round(avg * 100) / 100, sampleSize: matches.length };
};

/**
 * Public entry point. Returns current occupancy, predicted occupancy at
 * the target time, demand level, and a plain-language recommendation.
 */
const predictOccupancy = async (targetDate) => {
  const [totalSlots, occupiedCount] = await Promise.all([
    ParkingSlot.count(),
    ParkingSlot.count({ where: { status: { [Op.in]: [SLOT_STATUS.BOOKED, SLOT_STATUS.OCCUPIED] } } }),
  ]);
  const currentOccupancy = totalSlots === 0 ? 0 : Math.round((occupiedCount / totalSlots) * 10000) / 100;

  const { predictedOccupancy, sampleSize } = await predictFromHistory(new Date(targetDate));
  const effectivePrediction = predictedOccupancy === null ? currentOccupancy : predictedOccupancy;
  const tier = getTierForOccupancy(effectivePrediction);

  let recommendation = 'Parking availability looks normal for this time.';
  if (tier.demandLevel === 'HIGH') {
    recommendation = 'Consider arriving earlier — high demand is expected.';
  } else if (tier.demandLevel === 'MODERATE') {
    recommendation = 'Moderate demand expected; slots should still be findable.';
  }

  return {
    currentOccupancy,
    predictedOccupancy: effectivePrediction,
    demandLevel: tier.demandLevel,
    sampleSize,
    basedOnHistory: sampleSize > 0,
    recommendation,
  };
};

module.exports = { snapshotOccupancy, predictOccupancy, predictFromHistory };

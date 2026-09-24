const { Op } = require('sequelize');
const ParkingSlot = require('../models/ParkingSlot');
const AppError = require('../utils/AppError');
const { RECOMMENDATION_WEIGHTS, RECOMMENDATION_RESULT_LIMIT, SLOT_STATUS } = require('../config/constants');
const { calculateDynamicPrice } = require('./pricingService');
const { vehicleTypeContains } = require('../controllers/parkingController');

/**
 * SMART SLOT RECOMMENDATION
 * -------------------------
 * Given a user's vehicle type + preferences, this scores every compatible,
 * AVAILABLE slot on four transparent factors and returns a ranked list with
 * human-readable reasons — not just "here are the available slots."
 *
 * finalScore = distanceScore*0.40 + priceScore*0.20 + vehicleCompatibilityScore*0.25 + availabilityScore*0.15
 * (weights are configurable in config/constants.js)
 */

const scoreDistance = (slot, maxDistance) => {
  if (maxDistance === 0) return 100;
  const score = 100 - (slot.distanceFromEntrance / maxDistance) * 100;
  return Math.max(0, Math.round(score));
};

const scorePrice = (slot, maxPrice) => {
  if (maxPrice === 0) return 100;
  const score = 100 - (slot.pricePerHour / maxPrice) * 100;
  return Math.max(0, Math.round(score));
};

const scoreVehicleCompatibility = (slot, vehicleType, needsCharger) => {
  let score = 0;
  if (!slot.vehicleTypes.includes(vehicleType)) return 0;

  score += slot.vehicleTypes.length === 1 ? 70 : 50;

  if (needsCharger) {
    score += slot.hasCharger && slot.chargerStatus === 'AVAILABLE' ? 30 : 0;
  } else {
    score += 30;
  }

  return Math.min(100, score);
};

const scoreAvailability = (zoneAvailableCount, zoneTotalCount) => {
  if (zoneTotalCount === 0) return 100;
  return Math.round((zoneAvailableCount / zoneTotalCount) * 100);
};

const buildReasons = ({ slot, distanceScore, priceScore, compatScore, needsCharger, isCheapest, isClosest }) => {
  const reasons = [];

  if (isClosest) reasons.push('Closest to entrance');
  else if (distanceScore >= 70) reasons.push(`${slot.distanceFromEntrance}m from entrance`);

  reasons.push(`Compatible with ${slot.vehicleTypes.join(', ')}`);

  if (isCheapest) reasons.push('Lowest parking cost among matches');
  else if (priceScore >= 70) reasons.push('Competitively priced');

  if (needsCharger && slot.hasCharger && slot.chargerStatus === 'AVAILABLE') {
    reasons.push('EV charger available');
  }

  if (compatScore >= 90) reasons.push('Purpose-built for your vehicle type');

  return reasons;
};

/**
 * Main entry point.
 * @param {Object} preferences
 * @param {string} preferences.vehicleType - BIKE | CAR | SUV | EV
 * @param {string} [preferences.zone]
 * @param {number} [preferences.floor]
 * @param {boolean} [preferences.needsCharger]
 * @returns {Promise<Array<{slot, score, breakdown, reasons}>>}
 */
const getRecommendations = async (preferences) => {
  const { vehicleType, zone, floor, needsCharger } = preferences;

  if (!vehicleType) {
    throw new AppError('vehicleType is required to generate recommendations', 400);
  }

  const conditions = [{ status: SLOT_STATUS.AVAILABLE }, vehicleTypeContains(vehicleType)];
  if (zone) conditions.push({ zone: zone.toUpperCase() });
  if (floor !== undefined && floor !== null && floor !== '') conditions.push({ floor: Number(floor) });
  if (needsCharger) {
    conditions.push({ hasCharger: true });
    conditions.push({ chargerStatus: 'AVAILABLE' });
  }

  const candidates = await ParkingSlot.findAll({ where: { [Op.and]: conditions } });

  if (candidates.length === 0) {
    return [];
  }

  const zonesInvolved = [...new Set(candidates.map((s) => s.zone))];
  const zoneCounts = await Promise.all(
    zonesInvolved.map(async (z) => {
      const [available, total] = await Promise.all([
        ParkingSlot.count({ where: { zone: z, status: SLOT_STATUS.AVAILABLE } }),
        ParkingSlot.count({ where: { zone: z } }),
      ]);
      return [z, { available, total }];
    })
  );
  const zoneAvailabilityMap = Object.fromEntries(zoneCounts);

  const maxDistance = Math.max(...candidates.map((s) => s.distanceFromEntrance));
  const maxPrice = Math.max(...candidates.map((s) => s.pricePerHour));
  const minDistance = Math.min(...candidates.map((s) => s.distanceFromEntrance));
  const minPrice = Math.min(...candidates.map((s) => s.pricePerHour));

  const scored = candidates.map((slot) => {
    const distanceScore = scoreDistance(slot, maxDistance);
    const priceScore = scorePrice(slot, maxPrice);
    const compatScore = scoreVehicleCompatibility(slot, vehicleType, Boolean(needsCharger));
    const { available, total } = zoneAvailabilityMap[slot.zone] || { available: 0, total: 0 };
    const availabilityScore = scoreAvailability(available, total);

    const finalScore = Math.round(
      distanceScore * RECOMMENDATION_WEIGHTS.distance +
        priceScore * RECOMMENDATION_WEIGHTS.price +
        compatScore * RECOMMENDATION_WEIGHTS.vehicleCompatibility +
        availabilityScore * RECOMMENDATION_WEIGHTS.availability
    );

    const reasons = buildReasons({
      slot,
      distanceScore,
      priceScore,
      compatScore,
      needsCharger: Boolean(needsCharger),
      isCheapest: slot.pricePerHour === minPrice,
      isClosest: slot.distanceFromEntrance === minDistance,
    });

    return {
      slot,
      score: finalScore,
      breakdown: { distanceScore, priceScore, compatScore, availabilityScore },
      reasons,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, RECOMMENDATION_RESULT_LIMIT);

  const withPricing = await Promise.all(
    top.map(async (item) => {
      const pricing = await calculateDynamicPrice(item.slot.pricePerHour);
      return { ...item, pricing };
    })
  );

  return withPricing;
};

module.exports = { getRecommendations };

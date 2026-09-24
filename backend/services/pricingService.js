const { Op } = require('sequelize');
const ParkingSlot = require('../models/ParkingSlot');
const { PRICING_TIERS, SLOT_STATUS } = require('../config/constants');

/**
 * Computes current lot-wide occupancy percentage.
 * occupancy counts BOOKED + OCCUPIED slots as "unavailable capacity" —
 * a slot that's reserved is just as unavailable to a new arrival as one
 * physically occupied.
 */
const getCurrentOccupancy = async () => {
  const [totalSlots, unavailableSlots] = await Promise.all([
    ParkingSlot.count(),
    ParkingSlot.count({
      where: { status: { [Op.in]: [SLOT_STATUS.BOOKED, SLOT_STATUS.OCCUPIED] } },
    }),
  ]);

  const occupancyPercentage = totalSlots === 0 ? 0 : Math.round((unavailableSlots / totalSlots) * 10000) / 100;

  return { totalSlots, unavailableSlots, occupancyPercentage };
};

/**
 * Given an occupancy percentage, returns the configured pricing tier.
 * Tiers are read from config/constants.js so they can be retuned without
 * touching this logic (spec section 11: "configurable rather than hard-coded").
 */
const getTierForOccupancy = (occupancyPercentage) => {
  const tier = PRICING_TIERS.find((t) => occupancyPercentage <= t.maxOccupancy);
  return tier || PRICING_TIERS[PRICING_TIERS.length - 1];
};

/**
 * Calculates the dynamic price for a given slot's base price, given
 * current lot-wide demand.
 */
const calculateDynamicPrice = async (basePricePerHour) => {
  const { occupancyPercentage } = await getCurrentOccupancy();
  const tier = getTierForOccupancy(occupancyPercentage);

  const dynamicPricePerHour = Math.max(basePricePerHour, tier.pricePerHour);

  return {
    basePrice: basePricePerHour,
    currentOccupancy: occupancyPercentage,
    demandLevel: tier.demandLevel,
    dynamicPrice: dynamicPricePerHour,
  };
};

module.exports = {
  getCurrentOccupancy,
  getTierForOccupancy,
  calculateDynamicPrice,
};

const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { success } = require('../utils/response');
const { SLOT_STATUS, BOOKING_STATUS } = require('../config/constants');
const { getCurrentOccupancy } = require('../services/pricingService');
const { predictOccupancy } = require('../services/predictionService');

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * GET /api/analytics/overview
 * The main admin dashboard payload: slot counts, occupancy, today's
 * revenue/bookings, average duration, peak hours, most-used slots,
 * vehicle-type distribution, EV usage, and a near-term prediction.
 *
 * Uses a mix of Sequelize's ORM (simple counts) and raw SQL via
 * sequelize.query (grouped aggregations) — raw SQL is clearer and faster
 * than forcing multi-level GROUP BY through the query builder here.
 */
const getOverview = async (req, res, next) => {
  try {
    const [totalSlots, availableSlots, bookedSlots, occupiedSlots, maintenanceSlots] = await Promise.all([
      ParkingSlot.count(),
      ParkingSlot.count({ where: { status: SLOT_STATUS.AVAILABLE } }),
      ParkingSlot.count({ where: { status: SLOT_STATUS.BOOKED } }),
      ParkingSlot.count({ where: { status: SLOT_STATUS.OCCUPIED } }),
      ParkingSlot.count({ where: { status: SLOT_STATUS.MAINTENANCE } }),
    ]);

    const { occupancyPercentage } = await getCurrentOccupancy();
    const todayStart = startOfToday();

    const [todaysBookings, todaysCompleted] = await Promise.all([
      Booking.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      Booking.count({
        where: { status: BOOKING_STATUS.COMPLETED, actualExitTime: { [Op.gte]: todayStart } },
      }),
    ]);

    const [todaysRevenueRow] = await sequelize.query(
      `SELECT COALESCE(SUM(totalAmount), 0) AS total FROM bookings
       WHERE status = :status AND actualExitTime >= :todayStart`,
      { replacements: { status: BOOKING_STATUS.COMPLETED, todayStart }, type: QueryTypes.SELECT }
    );
    const [totalRevenueRow] = await sequelize.query(
      `SELECT COALESCE(SUM(totalAmount), 0) AS total FROM bookings WHERE status = :status`,
      { replacements: { status: BOOKING_STATUS.COMPLETED }, type: QueryTypes.SELECT }
    );

    const todaysRevenue = Number(todaysRevenueRow.total) || 0;
    const totalRevenue = Number(totalRevenueRow.total) || 0;

    const [durationRow] = await sequelize.query(
      `SELECT AVG(TIMESTAMPDIFF(SECOND, actualEntryTime, actualExitTime)) / 3600 AS avgDuration
       FROM bookings
       WHERE status = :status AND actualEntryTime IS NOT NULL AND actualExitTime IS NOT NULL`,
      { replacements: { status: BOOKING_STATUS.COMPLETED }, type: QueryTypes.SELECT }
    );
    const averageParkingDurationHours = Math.round((Number(durationRow.avgDuration) || 0) * 100) / 100;

    const peakHoursRows = await sequelize.query(
      `SELECT HOUR(actualEntryTime) AS hour, COUNT(*) AS bookingCount
       FROM bookings
       WHERE actualEntryTime IS NOT NULL
       GROUP BY HOUR(actualEntryTime)
       ORDER BY bookingCount DESC
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    const peakHours = peakHoursRows.map((r) => ({ hour: Number(r.hour), bookingCount: Number(r.bookingCount) }));

    const topSlotsRows = await sequelize.query(
      `SELECT b.parkingSlotId, ps.slotNumber, ps.zone, COUNT(*) AS bookingCount
       FROM bookings b
       LEFT JOIN parking_slots ps ON ps.id = b.parkingSlotId
       GROUP BY b.parkingSlotId, ps.slotNumber, ps.zone
       ORDER BY bookingCount DESC
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    const mostUsedSlots = topSlotsRows.map((r) => ({
      slotNumber: r.slotNumber,
      zone: r.zone,
      bookingCount: Number(r.bookingCount),
    }));

    const vehicleTypeRows = await sequelize.query(
      `SELECT vehicleType, COUNT(*) AS count FROM vehicles GROUP BY vehicleType`,
      { type: QueryTypes.SELECT }
    );
    const vehicleTypeDistribution = Object.fromEntries(
      vehicleTypeRows.map((r) => [r.vehicleType, Number(r.count)])
    );

    const [evSlotsTotal, evSlotsInUse] = await Promise.all([
      ParkingSlot.count({ where: { hasCharger: true } }),
      ParkingSlot.count({
        where: { hasCharger: true, status: { [Op.in]: [SLOT_STATUS.BOOKED, SLOT_STATUS.OCCUPIED] } },
      }),
    ]);

    const prediction = await predictOccupancy(new Date());

    return success(res, 200, 'Analytics overview retrieved successfully', {
      slots: { totalSlots, availableSlots, bookedSlots, occupiedSlots, maintenanceSlots },
      occupancyPercentage,
      todaysBookings,
      todaysCompleted,
      todaysRevenue,
      totalRevenue,
      averageParkingDurationHours,
      peakHours,
      mostUsedSlots,
      vehicleTypeDistribution,
      evUsage: { evSlotsTotal, evSlotsInUse },
      prediction,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/prediction?targetDate=ISO
 */
const getPrediction = async (req, res, next) => {
  try {
    const targetDate = req.query.targetDate ? new Date(req.query.targetDate) : new Date();
    const prediction = await predictOccupancy(targetDate);
    return success(res, 200, 'Prediction generated successfully', { prediction });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, getPrediction };

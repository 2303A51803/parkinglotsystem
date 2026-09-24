const { Op } = require('sequelize');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const { BOOKING_STATUS, SLOT_STATUS, BOOKING_GRACE_PERIOD_MINUTES } = require('../config/constants');

/**
 * Finds every BOOKED reservation whose grace period has elapsed without
 * the vehicle entering, marks it EXPIRED, and frees its slot. Designed to
 * be called repeatedly by a cron job (see utils/scheduler.js) so expired
 * reservations never permanently block a slot.
 */
const expireOverdueBookings = async () => {
  const cutoff = new Date(Date.now() - BOOKING_GRACE_PERIOD_MINUTES * 60 * 1000);

  const overdue = await Booking.findAll({
    where: {
      status: BOOKING_STATUS.BOOKED,
      startTime: { [Op.lte]: cutoff },
    },
  });

  if (overdue.length === 0) {
    return { expiredCount: 0 };
  }

  const bookingIds = overdue.map((b) => b.id);
  const slotIds = overdue.map((b) => b.parkingSlotId);

  await Booking.update(
    { status: BOOKING_STATUS.EXPIRED },
    { where: { id: { [Op.in]: bookingIds } } }
  );

  // Only free slots that are still BOOKED (defensive: avoid clobbering a slot
  // that somehow already transitioned, e.g. concurrent entry just before expiry ran)
  await ParkingSlot.update(
    { status: SLOT_STATUS.AVAILABLE },
    { where: { id: { [Op.in]: slotIds }, status: SLOT_STATUS.BOOKED } }
  );

  console.log(`Reservation expiry: expired ${overdue.length} booking(s)`);
  return { expiredCount: overdue.length };
};

module.exports = { expireOverdueBookings };

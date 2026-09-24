const crypto = require('crypto');
const { sequelize } = require('../config/db');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const { calculateDynamicPrice } = require('./pricingService');
const { calculateFee } = require('./feeCalculator');
const { SLOT_STATUS, BOOKING_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * DOUBLE-BOOKING PREVENTION (spec section 13)
 * --------------------------------------------
 * Two users hitting "book" on the same slot at the same instant must not
 * both succeed. In MySQL/Sequelize the idiomatic way to guarantee this is a
 * row lock inside a transaction: SELECT ... FOR UPDATE blocks any other
 * transaction from reading/locking that same row until we commit or roll
 * back, so the "check status, then flip it" sequence becomes atomic even
 * though it's two statements. Only one of two concurrent requests can hold
 * the lock at a time; the second sees the already-updated status.
 */
const reserveSlotAtomically = async (parkingSlotId, transaction) => {
  const slot = await ParkingSlot.findOne({
    where: { id: parkingSlotId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!slot || slot.status !== SLOT_STATUS.AVAILABLE) {
    return null;
  }

  slot.status = SLOT_STATUS.BOOKED;
  await slot.save({ transaction });
  return slot;
};

/**
 * Creates a booking end-to-end inside a single DB transaction: verify
 * vehicle ownership -> verify slot compatibility -> atomically reserve the
 * slot (row-locked) -> price it -> persist the booking. If anything fails,
 * the whole transaction rolls back, so the slot is never left stranded in
 * BOOKED state.
 */
const createBooking = async ({ userId, vehicleId, parkingSlotId, startTime, expectedEndTime }) => {
  const result = await sequelize.transaction(async (transaction) => {
    const vehicle = await Vehicle.findByPk(vehicleId, { transaction });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    if (vehicle.userId !== userId) {
      throw new AppError('You can only book using your own vehicle', 403);
    }

    if (new Date(expectedEndTime) <= new Date(startTime)) {
      throw new AppError('expectedEndTime must be after startTime', 400);
    }

    // Always re-verify on the backend, never trust frontend availability display (spec section 12)
    const reservedSlot = await reserveSlotAtomically(parkingSlotId, transaction);
    if (!reservedSlot) {
      throw new AppError('Parking slot is no longer available', 409);
    }

    if (!reservedSlot.vehicleTypes.includes(vehicle.vehicleType)) {
      throw new AppError(`This slot does not support ${vehicle.vehicleType} vehicles`, 400);
    }

    const pricing = await calculateDynamicPrice(reservedSlot.pricePerHour);

    const booking = await Booking.create(
      {
        userId,
        vehicleId,
        parkingSlotId,
        bookingDate: new Date(startTime),
        startTime,
        expectedEndTime,
        status: BOOKING_STATUS.BOOKED,
        basePrice: pricing.basePrice,
        dynamicPrice: pricing.dynamicPrice,
      },
      { transaction }
    );

    return booking;
  });

  return result;
};

/**
 * Cancels a BOOKED (not yet ACTIVE) booking and frees the slot.
 */
const cancelBooking = async (bookingId, userId) => {
  return sequelize.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== userId) {
      throw new AppError('You do not have access to this booking', 403);
    }
    if (booking.status !== BOOKING_STATUS.BOOKED) {
      throw new AppError(`Cannot cancel a booking with status ${booking.status}`, 409);
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    await booking.save({ transaction });

    await ParkingSlot.update(
      { status: SLOT_STATUS.AVAILABLE },
      { where: { id: booking.parkingSlotId }, transaction }
    );

    return booking;
  });
};

/**
 * Vehicle entry: BOOKED -> ACTIVE, slot -> OCCUPIED.
 */
const recordEntry = async (bookingId, userId) => {
  return sequelize.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== userId) {
      throw new AppError('You do not have access to this booking', 403);
    }
    if (booking.status !== BOOKING_STATUS.BOOKED) {
      throw new AppError(`Cannot record entry for a booking with status ${booking.status}`, 409);
    }

    booking.status = BOOKING_STATUS.ACTIVE;
    booking.actualEntryTime = new Date();
    await booking.save({ transaction });

    await ParkingSlot.update(
      { status: SLOT_STATUS.OCCUPIED },
      { where: { id: booking.parkingSlotId }, transaction }
    );

    return booking;
  });
};

/**
 * Vehicle exit: ACTIVE -> COMPLETED, calculates fee, frees slot,
 * creates a simulated Payment record.
 */
const recordExit = async (bookingId, userId) => {
  return sequelize.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== userId) {
      throw new AppError('You do not have access to this booking', 403);
    }
    if (booking.status !== BOOKING_STATUS.ACTIVE) {
      throw new AppError(`Cannot record exit for a booking with status ${booking.status}`, 409);
    }

    const actualExitTime = new Date();
    const { totalAmount } = calculateFee(booking.actualEntryTime, actualExitTime, booking.dynamicPrice);

    booking.actualExitTime = actualExitTime;
    booking.totalAmount = totalAmount;
    booking.status = BOOKING_STATUS.COMPLETED;
    await booking.save({ transaction });

    await ParkingSlot.update(
      { status: SLOT_STATUS.AVAILABLE },
      { where: { id: booking.parkingSlotId }, transaction }
    );

    const payment = await Payment.create(
      {
        bookingId: booking.id,
        userId,
        amount: totalAmount,
        paymentStatus: PAYMENT_STATUS.SUCCESS, // simulated — spec section 5, no real gateway yet
        paymentMethod: 'SIMULATED_UPI',
        transactionId: crypto.randomUUID(),
      },
      { transaction }
    );

    return { booking, payment };
  });
};

module.exports = {
  reserveSlotAtomically,
  createBooking,
  cancelBooking,
  recordEntry,
  recordExit,
};

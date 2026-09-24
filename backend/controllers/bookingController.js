const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const ParkingSlot = require('../models/ParkingSlot');
const AppError = require('../utils/AppError');
const { success } = require('../utils/response');
const bookingService = require('../services/bookingService');

/**
 * POST /api/bookings
 */
const createBooking = async (req, res, next) => {
  try {
    const { vehicleId, parkingSlotId, startTime, expectedEndTime } = req.body;

    const booking = await bookingService.createBooking({
      userId: req.user.id,
      vehicleId,
      parkingSlotId,
      startTime,
      expectedEndTime,
    });

    return success(res, 201, 'Booking created successfully', { booking });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/my
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [{ model: Vehicle, as: 'vehicle' }, { model: ParkingSlot, as: 'parkingSlot' }],
      order: [['createdAt', 'DESC']],
    });

    return success(res, 200, 'Bookings retrieved successfully', { bookings });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Vehicle, as: 'vehicle' }, { model: ParkingSlot, as: 'parkingSlot' }],
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== req.user.id) {
      throw new AppError('You do not have access to this booking', 403);
    }

    return success(res, 200, 'Booking retrieved successfully', { booking });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(Number(req.params.id), req.user.id);
    return success(res, 200, 'Booking cancelled successfully', { booking });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/bookings/:id/entry
 */
const recordEntry = async (req, res, next) => {
  try {
    const booking = await bookingService.recordEntry(Number(req.params.id), req.user.id);
    return success(res, 200, 'Vehicle entry recorded successfully', { booking });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/bookings/:id/exit
 */
const recordExit = async (req, res, next) => {
  try {
    const { booking, payment } = await bookingService.recordExit(Number(req.params.id), req.user.id);
    return success(res, 200, 'Vehicle exit recorded, fee calculated successfully', {
      booking,
      payment,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  recordEntry,
  recordExit,
};

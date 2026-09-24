const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const AppError = require('../utils/AppError');
const { success } = require('../utils/response');

/**
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    return success(res, 200, 'Users retrieved successfully', { users });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    const vehicles = await Vehicle.findAll({ where: { userId: user.id } });
    return success(res, 200, 'User retrieved successfully', { user, vehicles });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    if (user.id === req.user.id) {
      throw new AppError('Admins cannot delete their own account via this endpoint', 400);
    }

    await user.destroy();
    return success(res, 200, 'User deleted successfully', {});
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/vehicles
 */
const getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    return success(res, 200, 'Vehicles retrieved successfully', { vehicles });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings
 * Supports optional ?status= filter for monitoring.
 */
const getAllBookings = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status.toUpperCase();

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Vehicle, as: 'vehicle' },
        { model: ParkingSlot, as: 'parkingSlot' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return success(res, 200, 'Bookings retrieved successfully', { bookings });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  getAllVehicles,
  getAllBookings,
};

const Vehicle = require('../models/Vehicle');
const AppError = require('../utils/AppError');
const { success } = require('../utils/response');

/**
 * POST /api/vehicles
 */
const addVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, vehicleType, fuelType } = req.body;

    const existing = await Vehicle.findOne({ where: { vehicleNumber: vehicleNumber.toUpperCase() } });
    if (existing) {
      throw new AppError('A vehicle with this number is already registered', 409);
    }

    const vehicle = await Vehicle.create({
      userId: req.user.id,
      vehicleNumber,
      vehicleType,
      fuelType,
    });

    return success(res, 201, 'Vehicle added successfully', { vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehicles
 */
const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    return success(res, 200, 'Vehicles retrieved successfully', { vehicles });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehicles/:id
 */
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }
    if (vehicle.userId !== req.user.id) {
      throw new AppError('You do not have access to this vehicle', 403);
    }
    return success(res, 200, 'Vehicle retrieved successfully', { vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/vehicles/:id
 */
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }
    if (vehicle.userId !== req.user.id) {
      throw new AppError('You do not have access to this vehicle', 403);
    }

    const { vehicleType, fuelType } = req.body;
    // vehicleNumber intentionally not editable post-creation to preserve booking history integrity
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (fuelType) vehicle.fuelType = fuelType;

    await vehicle.save();

    return success(res, 200, 'Vehicle updated successfully', { vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/vehicles/:id
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }
    if (vehicle.userId !== req.user.id) {
      throw new AppError('You do not have access to this vehicle', 403);
    }

    await vehicle.destroy();

    return success(res, 200, 'Vehicle deleted successfully', {});
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};

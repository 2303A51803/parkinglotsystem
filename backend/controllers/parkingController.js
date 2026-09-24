const { Op, fn, col, where: sequelizeWhere } = require('sequelize');
const ParkingSlot = require('../models/ParkingSlot');
const AppError = require('../utils/AppError');
const { success } = require('../utils/response');
const { SLOT_STATUS } = require('../config/constants');

/**
 * vehicleTypes is stored as a JSON array column. MySQL's JSON_CONTAINS lets
 * us filter "slots whose vehicleTypes array includes X" without a join table.
 */
const vehicleTypeContains = (vehicleType) =>
  sequelizeWhere(fn('JSON_CONTAINS', col('vehicleTypes'), JSON.stringify(vehicleType)), 1);

/**
 * GET /api/parking/slots
 */
const getAllSlots = async (req, res, next) => {
  try {
    const { zone, floor, vehicleType, status } = req.query;
    const conditions = [];

    if (zone) conditions.push({ zone: zone.toUpperCase() });
    if (floor !== undefined) conditions.push({ floor: Number(floor) });
    if (status) conditions.push({ status: status.toUpperCase() });
    if (vehicleType) conditions.push(vehicleTypeContains(vehicleType.toUpperCase()));

    const slots = await ParkingSlot.findAll({
      where: conditions.length ? { [Op.and]: conditions } : undefined,
      order: [
        ['zone', 'ASC'],
        ['floor', 'ASC'],
        ['slotNumber', 'ASC'],
      ],
    });

    return success(res, 200, 'Parking slots retrieved successfully', { slots, count: slots.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/parking/slots/available
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { vehicleType, evOnly } = req.query;
    const conditions = [{ status: SLOT_STATUS.AVAILABLE }];

    if (vehicleType) conditions.push(vehicleTypeContains(vehicleType.toUpperCase()));
    if (evOnly === 'true') {
      conditions.push({ hasCharger: true });
      conditions.push({ chargerStatus: 'AVAILABLE' });
    }

    const slots = await ParkingSlot.findAll({
      where: { [Op.and]: conditions },
      order: [['distanceFromEntrance', 'ASC']],
    });

    return success(res, 200, 'Available parking slots retrieved successfully', {
      slots,
      count: slots.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/parking/slots/:id
 */
const getSlotById = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findByPk(req.params.id);
    if (!slot) {
      throw new AppError('Parking slot not found', 404);
    }
    return success(res, 200, 'Parking slot retrieved successfully', { slot });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/parking/slots (ADMIN only)
 */
const createSlot = async (req, res, next) => {
  try {
    const { coordinates, ...rest } = req.body;
    const payload = { ...rest };
    if (coordinates) {
      payload.coordinateRow = coordinates.row;
      payload.coordinateCol = coordinates.col;
    }

    const slot = await ParkingSlot.create(payload);
    return success(res, 201, 'Parking slot created successfully', { slot });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/parking/slots/:id (ADMIN only)
 */
const updateSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findByPk(req.params.id);
    if (!slot) {
      throw new AppError('Parking slot not found', 404);
    }

    const incomingStatus = req.body.status;
    if (
      incomingStatus === SLOT_STATUS.AVAILABLE &&
      [SLOT_STATUS.BOOKED, SLOT_STATUS.OCCUPIED].includes(slot.status)
    ) {
      throw new AppError(
        'Cannot manually mark a booked/occupied slot as available; cancel or complete the booking instead',
        409
      );
    }

    const { coordinates, ...rest } = req.body;
    Object.assign(slot, rest);
    if (coordinates) {
      slot.coordinateRow = coordinates.row;
      slot.coordinateCol = coordinates.col;
    }

    await slot.save();

    return success(res, 200, 'Parking slot updated successfully', { slot });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/parking/slots/:id (ADMIN only)
 */
const deleteSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findByPk(req.params.id);
    if (!slot) {
      throw new AppError('Parking slot not found', 404);
    }
    if ([SLOT_STATUS.BOOKED, SLOT_STATUS.OCCUPIED].includes(slot.status)) {
      throw new AppError('Cannot delete a slot that is currently booked or occupied', 409);
    }

    await slot.destroy();
    return success(res, 200, 'Parking slot deleted successfully', {});
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSlots,
  getAvailableSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  vehicleTypeContains,
};

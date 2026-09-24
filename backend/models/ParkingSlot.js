const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { VEHICLE_TYPES, SLOT_STATUS, CHARGER_STATUS } = require('../config/constants');

const ParkingSlot = sequelize.define(
  'ParkingSlot',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    slotNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('slotNumber', value.toUpperCase().trim());
      },
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    zone: {
      type: DataTypes.STRING(10),
      allowNull: false,
      set(value) {
        this.setDataValue('zone', value.toUpperCase().trim());
      },
    },
    // Stored as JSON since a slot can support multiple vehicle types
    // (e.g. an EV slot that also fits regular CARs).
    vehicleTypes: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidList(value) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('At least one compatible vehicle type is required');
          }
          value.forEach((v) => {
            if (!VEHICLE_TYPES.includes(v)) {
              throw new Error(`Invalid vehicle type: ${v}`);
            }
          });
        },
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SLOT_STATUS)),
      defaultValue: SLOT_STATUS.AVAILABLE,
    },
    pricePerHour: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },
    distanceFromEntrance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },
    hasCharger: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    chargerStatus: {
      type: DataTypes.ENUM(...Object.values(CHARGER_STATUS)),
      defaultValue: CHARGER_STATUS.NONE,
    },
    coordinateRow: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    coordinateCol: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'parking_slots',
    hooks: {
      beforeValidate: (slot) => {
        if (!slot.hasCharger) {
          slot.chargerStatus = CHARGER_STATUS.NONE;
        } else if (!slot.chargerStatus || slot.chargerStatus === CHARGER_STATUS.NONE) {
          slot.chargerStatus = CHARGER_STATUS.AVAILABLE;
        }
      },
    },
    indexes: [{ fields: ['status'] }, { fields: ['zone', 'floor'] }],
  }
);

/**
 * Convenience accessor mirroring the old { row, col } shape used by the
 * frontend/map, so controllers can keep returning `coordinates: {row, col}`.
 */
ParkingSlot.prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  values.coordinates = { row: values.coordinateRow, col: values.coordinateCol };
  delete values.coordinateRow;
  delete values.coordinateCol;
  return values;
};

module.exports = ParkingSlot;

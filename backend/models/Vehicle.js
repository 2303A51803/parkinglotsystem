const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { VEHICLE_TYPES, FUEL_TYPES } = require('../config/constants');

const Vehicle = sequelize.define(
  'Vehicle',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    vehicleNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: { msg: 'A vehicle with this number is already registered' },
      set(value) {
        this.setDataValue('vehicleNumber', value.toUpperCase().trim());
      },
      validate: {
        is: {
          args: /^[A-Z0-9\- ]{4,15}$/,
          msg: 'Please provide a valid vehicle number',
        },
      },
    },
    vehicleType: {
      type: DataTypes.ENUM(...VEHICLE_TYPES),
      allowNull: false,
    },
    fuelType: {
      type: DataTypes.ENUM(...FUEL_TYPES),
      allowNull: false,
    },
  },
  {
    tableName: 'vehicles',
    hooks: {
      beforeValidate: (vehicle) => {
        if (vehicle.vehicleType === 'EV') {
          vehicle.fuelType = 'ELECTRIC';
        }
      },
    },
  }
);

module.exports = Vehicle;

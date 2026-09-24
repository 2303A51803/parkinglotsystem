const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { BOOKING_STATUS } = require('../config/constants');

const Booking = sequelize.define(
  'Booking',
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
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parkingSlotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expectedEndTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actualEntryTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    actualExitTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BOOKING_STATUS)),
      defaultValue: BOOKING_STATUS.BOOKED,
    },
    basePrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    dynamicPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'bookings',
    indexes: [{ fields: ['parkingSlotId', 'status'] }, { fields: ['userId'] }, { fields: ['status'] }],
  }
);

module.exports = Booking;

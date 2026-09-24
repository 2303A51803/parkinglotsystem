const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ParkingHistory = sequelize.define(
  'ParkingHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parkingSlotId: {
      // null = aggregate lot-wide snapshot (used by prediction/analytics)
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    hour: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 23 },
    },
    occupiedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    availableCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    totalSlots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    occupancyPercentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
  },
  {
    tableName: 'parking_history',
    indexes: [{ fields: ['dayOfWeek', 'hour'] }, { fields: ['date'] }],
  }
);

module.exports = ParkingHistory;

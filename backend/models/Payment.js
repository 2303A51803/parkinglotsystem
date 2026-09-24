const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { PAYMENT_STATUS } = require('../config/constants');

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      defaultValue: PAYMENT_STATUS.PENDING,
    },
    paymentMethod: {
      // Simulated only — no real gateway integration in this version
      type: DataTypes.ENUM('SIMULATED_CARD', 'SIMULATED_UPI', 'SIMULATED_WALLET'),
      defaultValue: 'SIMULATED_UPI',
    },
    transactionId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'payments',
    updatedAt: false,
  }
);

module.exports = Payment;

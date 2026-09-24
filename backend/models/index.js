const { sequelize } = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');
const ParkingSlot = require('./ParkingSlot');
const Booking = require('./Booking');
const ParkingHistory = require('./ParkingHistory');
const Payment = require('./Payment');

// --- Associations ---

User.hasMany(Vehicle, { foreignKey: 'userId', onDelete: 'CASCADE' });
Vehicle.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Booking, { foreignKey: 'userId', onDelete: 'CASCADE' });
Booking.belongsTo(User, { foreignKey: 'userId' });

Vehicle.hasMany(Booking, { foreignKey: 'vehicleId' });
// alias 'vehicle' (lowercase) so booking.vehicle reads naturally in API responses
Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

ParkingSlot.hasMany(Booking, { foreignKey: 'parkingSlotId' });
// alias 'parkingSlot' so booking.parkingSlot reads naturally in API responses
Booking.belongsTo(ParkingSlot, { foreignKey: 'parkingSlotId', as: 'parkingSlot' });

ParkingSlot.hasMany(ParkingHistory, { foreignKey: 'parkingSlotId' });
ParkingHistory.belongsTo(ParkingSlot, { foreignKey: 'parkingSlotId' });

Booking.hasOne(Payment, { foreignKey: 'bookingId' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Vehicle,
  ParkingSlot,
  Booking,
  ParkingHistory,
  Payment,
};

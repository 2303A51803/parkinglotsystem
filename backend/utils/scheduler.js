const cron = require('node-cron');
const { expireOverdueBookings } = require('../services/reservationExpiryService');
const { snapshotOccupancy } = require('../services/predictionService');

/**
 * Starts all scheduled background jobs. Called once from server.js.
 */
const startScheduledJobs = () => {
  // Every minute: expire overdue reservations so slots don't stay blocked (spec section 16)
  cron.schedule('* * * * *', async () => {
    try {
      await expireOverdueBookings();
    } catch (err) {
      console.error('Reservation expiry job failed:', err.message);
    }
  });

  // Every hour on the hour: snapshot current occupancy into ParkingHistory,
  // which powers both analytics and the prediction service (spec sections 19-20)
  cron.schedule('0 * * * *', async () => {
    try {
      await snapshotOccupancy();
    } catch (err) {
      console.error('Occupancy snapshot job failed:', err.message);
    }
  });

  console.log('Scheduled jobs started: reservation expiry (every minute), occupancy snapshot (hourly)');
};

module.exports = { startScheduledJobs };

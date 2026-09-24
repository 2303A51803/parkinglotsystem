const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  recordEntry,
  recordExit,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { validate, bookingValidation } = require('../middleware/validationMiddleware');

router.use(protect);

router.post('/', bookingValidation, validate, createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/entry', recordEntry);
router.put('/:id/exit', recordExit);

module.exports = router;

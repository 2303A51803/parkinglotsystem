const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  deleteUser,
  getAllVehicles,
  getAllBookings,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly); // every admin route requires ADMIN role

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);
router.get('/vehicles', getAllVehicles);
router.get('/bookings', getAllBookings);

module.exports = router;

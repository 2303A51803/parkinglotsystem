const express = require('express');
const router = express.Router();

const {
  getAllSlots,
  getAvailableSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
} = require('../controllers/parkingController');
const { getRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Reads: any authenticated user
router.get('/slots', protect, getAllSlots);
router.get('/slots/available', protect, getAvailableSlots);
router.post('/recommendations', protect, getRecommendations);
router.get('/slots/:id', protect, getSlotById);

// Writes: ADMIN only
router.post('/slots', protect, adminOnly, createSlot);
router.put('/slots/:id', protect, adminOnly, updateSlot);
router.delete('/slots/:id', protect, adminOnly, deleteSlot);

module.exports = router;

const express = require('express');
const router = express.Router();

const { getOverview, getPrediction } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);

router.get('/overview', getOverview);
router.get('/prediction', getPrediction);

module.exports = router;

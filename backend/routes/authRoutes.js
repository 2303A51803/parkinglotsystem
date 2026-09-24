const express = require('express');
const router = express.Router();

const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  registerValidation,
  loginValidation,
} = require('../middleware/validationMiddleware');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/profile', protect, getProfile);

module.exports = router;

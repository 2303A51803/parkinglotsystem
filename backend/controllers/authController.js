const User = require('../models/User');
const AppError = require('../utils/AppError');
const { success } = require('../utils/response');
const { generateToken } = require('../utils/jwt');
const { ROLES } = require('../config/constants');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.USER, // role is never trusted from client input on registration
    });

    const token = generateToken({ id: user.id, role: user.role });

    return success(res, 201, 'Registration successful', {
      user: user.toSafeObject(),
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, role: user.role });

    return success(res, 200, 'Login successful', {
      user: user.toSafeObject(),
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/profile
 * Requires `protect` middleware — req.user is already populated.
 */
const getProfile = async (req, res, next) => {
  try {
    return success(res, 200, 'Profile retrieved successfully', {
      user: req.user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };

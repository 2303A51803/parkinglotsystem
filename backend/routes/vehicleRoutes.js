const express = require('express');
const router = express.Router();

const {
  addVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');
const { validate, vehicleValidation } = require('../middleware/validationMiddleware');

router.use(protect); // every vehicle route requires authentication

router.post('/', vehicleValidation, validate, addVehicle);
router.get('/', getMyVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;

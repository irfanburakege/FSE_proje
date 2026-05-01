const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');

router.get('/:doctorId', availabilityController.getDoctorAvailability);
router.put('/:doctorId', availabilityController.updateDoctorAvailability);

module.exports = router;

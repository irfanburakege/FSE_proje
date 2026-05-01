const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.get('/', appointmentController.getAppointments);
router.post('/', appointmentController.createAppointment);
router.put('/:id/status', appointmentController.updateAppointmentStatus);
router.put('/:id/priority', appointmentController.updateAppointmentPriority);
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);

module.exports = router;

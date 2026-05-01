const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');

router.get('/', visitController.getVisits);
router.post('/checkin', visitController.checkIn);
router.put('/:id/status', visitController.updateStatus);

module.exports = router;

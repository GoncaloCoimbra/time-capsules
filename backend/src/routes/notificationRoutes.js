const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.list);
router.patch('/:id/read', auth, notificationController.markRead);
router.post('/schedule', auth, notificationController.schedule);
router.post('/send-email', auth, notificationController.sendEmail);

module.exports = router;

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.list);
router.patch('/:id/read', auth, notificationController.markRead);

module.exports = router;

const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const auth = require('../middleware/auth');

router.post('/toggle', auth, followController.toggleFollow);
router.get('/following/:userId', auth, followController.getFollowing);
router.get('/followers/:userId', auth, followController.getFollowers);

module.exports = router;

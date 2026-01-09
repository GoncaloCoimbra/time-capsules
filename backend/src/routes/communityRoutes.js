const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const auth = require('../middleware/auth');

router.get('/explore/public', auth, communityController.explorePublic);
router.get('/stats', auth, communityController.getCommunityStats);
router.get('/leaderboard', auth, communityController.getLeaderboard);
router.post('/track-view', auth, communityController.trackView);
router.get('/trending', auth, communityController.getTrendingTechs);

module.exports = router;

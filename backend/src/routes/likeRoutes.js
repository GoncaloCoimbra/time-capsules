const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const auth = require('../middleware/auth');

router.post('/toggle', auth, likeController.toggleLike);
router.get('/:capsuleId/count', auth, likeController.getLikesCount);
router.get('/:capsuleId/check', auth, likeController.isLiked);

module.exports = router;

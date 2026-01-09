const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.post('/:capsuleId', auth, commentController.addComment);
router.get('/:capsuleId', auth, commentController.getComments);
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;

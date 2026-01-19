const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const auth = require('../middleware/auth');



// Toggle de reação específica (adiciona/remove)
router.post('/reaction/toggle', auth, likeController.toggleReaction);

// Obter resumo de todas as reações de uma cápsula/comentário
router.get('/reaction/capsule/:capsuleId/summary', likeController.getReactionsSummary);
router.get('/reaction/comment/:commentId/summary', likeController.getReactionsSummary);

// Obter reações do usuário logado para uma cápsula/comentário
router.get('/reaction/capsule/:capsuleId/user', auth, likeController.getUserReactions);
router.get('/reaction/comment/:commentId/user', auth, likeController.getUserReactions);


router.post('/toggle', auth, likeController.toggleLike);
router.get('/:capsuleId/count', auth, likeController.getLikesCount);
router.get('/:capsuleId/check', auth, likeController.isLiked);

module.exports = router;
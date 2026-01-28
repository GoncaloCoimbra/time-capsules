const express = require('express');
const router = express.Router();
const capsuleController = require('../controllers/capsuleController');
const auth = require('../middleware/auth');
const ensureDefaultCategories = require('../middleware/ensureDefaultCategories');

// Aplicar o middleware de categorias padrão em todas as rotas
router.use(auth, ensureDefaultCategories);

router.get('/statistics', capsuleController.getStatistics);
router.get('/export', capsuleController.exportData);
router.get('/followed/list', capsuleController.getFollowedCapsules);
router.get('/check/unlock-status', capsuleController.checkUnlockStatus);
router.post('/test/force-unlock', capsuleController.forceUnlockAll);
router.post('/test/update-unlock-date', capsuleController.updateUnlockDate);
router.post('/', capsuleController.createCapsule);
router.get('/', capsuleController.getCapsules);
router.post('/:id/follow', capsuleController.toggleFollowCapsule);
router.get('/:id/followers', capsuleController.getCapsuleFollowers);
router.get('/:id/is-following', capsuleController.isFollowingCapsule);
router.get('/:id', capsuleController.getCapsuleById);
router.put('/:id', capsuleController.updateCapsule);
router.patch('/:id/favorite', capsuleController.toggleFavorite);
router.delete('/:id', capsuleController.deleteCapsule);

module.exports = router;
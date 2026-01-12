const express = require('express');
const router = express.Router();
const capsuleController = require('../controllers/capsuleController');
const auth = require('../middleware/auth');
const ensureDefaultCategories = require('../middleware/ensureDefaultCategories');

// Aplicar o middleware de categorias padrão em todas as rotas
router.use(auth, ensureDefaultCategories);

router.get('/statistics', capsuleController.getStatistics);
router.get('/export', capsuleController.exportData);
router.post('/', capsuleController.createCapsule);
router.get('/', capsuleController.getCapsules);
router.get('/:id', capsuleController.getCapsuleById);
router.put('/:id', capsuleController.updateCapsule);
router.patch('/:id/favorite', capsuleController.toggleFavorite);
router.delete('/:id', capsuleController.deleteCapsule);

module.exports = router;
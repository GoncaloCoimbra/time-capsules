const express = require('express');
const router = express.Router();
const capsuleController = require('../controllers/capsuleController');
const auth = require('../middleware/auth');

router.get('/statistics', auth, capsuleController.getStatistics);
router.get('/export', auth, capsuleController.exportData);
router.post('/', auth, capsuleController.createCapsule);
router.get('/', auth, capsuleController.getCapsules);
router.get('/:id', auth, capsuleController.getCapsuleById);
router.put('/:id', auth, capsuleController.updateCapsule);
router.patch('/:id/favorite', auth, capsuleController.toggleFavorite);
router.delete('/:id', auth, capsuleController.deleteCapsule);

module.exports = router;

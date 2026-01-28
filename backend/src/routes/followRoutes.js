const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const auth = require('../middleware/auth');

router.post('/toggle', auth, followController.toggleFollow);
router.get('/following/:userId', auth, followController.getFollowing);
router.get('/followers/:userId', auth, followController.getFollowers);

// Rotas para gestão de pedidos de seguimento (contas privadas)
router.get('/requests/pending', auth, followController.getPendingRequests);
router.post('/requests/:requesterId/approve', auth, followController.approvePendingRequest);
router.post('/requests/:requesterId/reject', auth, followController.rejectPendingRequest);

module.exports = router;

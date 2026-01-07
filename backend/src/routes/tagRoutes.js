const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const auth = require('../middleware/auth');

router.post('/', auth, tagController.createTag);
router.get('/', auth, tagController.getTags);
router.delete('/:id', auth, tagController.deleteTag);

module.exports = router;

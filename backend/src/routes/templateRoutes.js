const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');

router.get('/', auth, templateController.getTemplates);
router.post('/', auth, templateController.createTemplate);
router.delete('/:id', auth, templateController.deleteTemplate);

module.exports = router;

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const ensureDefaultCategories = require('../middleware/ensureDefaultCategories');

// Aplicar middleware de categorias padrão
router.use(auth, ensureDefaultCategories);

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
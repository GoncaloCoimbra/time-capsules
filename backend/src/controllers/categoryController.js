const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const category = await Category.create({
      name,
      color: color || '#6366f1',
      userId: req.user.userId
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.user.userId },
      order: [['name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const category = await Category.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.update({ name, color });
    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.destroy({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

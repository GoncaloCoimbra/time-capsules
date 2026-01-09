const Template = require('../models/Template');

exports.getTemplates = async (req, res) => {
  try {
    const where = { isPublic: true };
    if (req.query.category) {
      where.category = req.query.category;
    }
    
    const templates = await Template.findAll({
      where,
      order: [['name', 'ASC']]
    });
    
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, content, category, isPublic } = req.body;
    
    const template = await Template.create({
      name,
      description,
      content,
      category: category || 'general',
      isPublic: isPublic !== undefined ? isPublic : true,
      userId: req.user.userId
    });
    
    res.status(201).json({ message: 'Template created successfully', template });
  } catch (error) {
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const deleted = await Template.destroy({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
};

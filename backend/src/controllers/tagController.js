const Tag = require('../models/Tag');
const Capsule = require('../models/Capsule');
const CapsuleTag = require('../models/CapsuleTag');

exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;
    
    const existingTag = await Tag.findOne({
      where: { name, userId: req.user.userId }
    });
    
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }
    
    const tag = await Tag.create({
      name,
      userId: req.user.userId
    });

    res.status(201).json({ message: 'Tag created successfully', tag });
  } catch (error) {
    res.status(500).json({ message: 'Error creating tag', error: error.message });
  }
};

exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { userId: req.user.userId },
      order: [['name', 'ASC']]
    });

    res.json({ tags });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tags', error: error.message });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const deleted = await Tag.destroy({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    await CapsuleTag.destroy({ where: { tagId: req.params.id } });

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tag', error: error.message });
  }
};

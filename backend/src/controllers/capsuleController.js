const Capsule = require('../models/Capsule');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const CapsuleTag = require('../models/CapsuleTag');
const { Op } = require('sequelize');

exports.createCapsule = async (req, res) => {
  try {
    const { title, content, unlockDate, categoryId, isPrivate, color, reminder, tags } = req.body;

    if (categoryId) {
      const category = await Category.findOne({
        where: { id: categoryId, userId: req.user.userId }
      });
      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    const capsule = await Capsule.create({
      title,
      content,
      unlockDate,
      categoryId: categoryId || null,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      color: color || '#6366f1',
      reminder: reminder || 0,
      creatorId: req.user.userId
    });

    if (tags && tags.length > 0) {
      const capsuleTags = tags.map(tagId => ({
        capsuleId: capsule.id,
        tagId: tagId
      }));
      await CapsuleTag.bulkCreate(capsuleTags);
    }

    res.status(201).json({
      message: 'Capsule created successfully',
      capsule
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating capsule', error: error.message });
  }
};

exports.getCapsules = async (req, res) => {
  try {
    const { categoryId, status, tagId } = req.query;
    
    const where = { creatorId: req.user.userId };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (status === 'locked') {
      where.isUnlocked = false;
    } else if (status === 'unlocked') {
      where.isUnlocked = true;
    }

    const include = [
      {
        model: Category,
        as: 'category',
        required: false
      },
      {
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
        required: false
      }
    ];

    if (tagId) {
      include[1].where = { id: tagId };
      include[1].required = true;
    }

    const capsules = await Capsule.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']]
    });

    res.json({ capsules });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching capsules', error: error.message });
  }
};

exports.getCapsuleById = async (req, res) => {
  try {
    const capsule = await Capsule.findOne({
      where: {
        id: req.params.id,
        creatorId: req.user.userId
      },
      include: [
        {
          model: Category,
          as: 'category',
          required: false
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });

    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    const now = new Date();
    if (now >= capsule.unlockDate && !capsule.isUnlocked) {
      capsule.isUnlocked = true;
      await capsule.save();
    }

    await capsule.update({
      viewCount: capsule.viewCount + 1,
      lastViewed: new Date()
    });

    res.json({ capsule });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching capsule', error: error.message });
  }
};

exports.updateCapsule = async (req, res) => {
  try {
    const { title, content, unlockDate, categoryId, isPrivate, color, reminder, tags } = req.body;
    
    const capsule = await Capsule.findOne({
      where: {
        id: req.params.id,
        creatorId: req.user.userId
      }
    });

    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    if (categoryId) {
      const category = await Category.findOne({
        where: { id: categoryId, userId: req.user.userId }
      });
      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    await capsule.update({ 
      title, 
      content, 
      unlockDate, 
      categoryId: categoryId || null,
      isPrivate: isPrivate !== undefined ? isPrivate : capsule.isPrivate,
      color: color || capsule.color,
      reminder: reminder !== undefined ? reminder : capsule.reminder
    });

    if (tags !== undefined) {
      await CapsuleTag.destroy({ where: { capsuleId: capsule.id } });
      
      if (tags.length > 0) {
        const capsuleTags = tags.map(tagId => ({
          capsuleId: capsule.id,
          tagId: tagId
        }));
        await CapsuleTag.bulkCreate(capsuleTags);
      }
    }

    res.json({ message: 'Capsule updated successfully', capsule });
  } catch (error) {
    res.status(500).json({ message: 'Error updating capsule', error: error.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const capsule = await Capsule.findOne({
      where: {
        id: req.params.id,
        creatorId: req.user.userId
      }
    });

    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    await capsule.update({ isFavorite: !capsule.isFavorite });

    res.json({ message: 'Favorite toggled', capsule });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling favorite', error: error.message });
  }
};

exports.deleteCapsule = async (req, res) => {
  try {
    await CapsuleTag.destroy({ where: { capsuleId: req.params.id } });
    
    const deleted = await Capsule.destroy({
      where: {
        id: req.params.id,
        creatorId: req.user.userId
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    res.json({ message: 'Capsule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting capsule', error: error.message });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const totalCapsules = await Capsule.count({
      where: { creatorId: userId }
    });
    
    const lockedCapsules = await Capsule.count({
      where: { creatorId: userId, isUnlocked: false }
    });
    
    const unlockedCapsules = await Capsule.count({
      where: { creatorId: userId, isUnlocked: true }
    });
    
    const totalViews = await Capsule.sum('viewCount', {
      where: { creatorId: userId }
    }) || 0;
    
    const favoritesCount = await Capsule.count({
      where: { creatorId: userId, isFavorite: true }
    });
    
    const nextUnlock = await Capsule.findOne({
      where: {
        creatorId: userId,
        isUnlocked: false,
        unlockDate: { [Op.gt]: new Date() }
      },
      order: [['unlockDate', 'ASC']]
    });

    const capsulesByMonth = await Capsule.findAll({
      where: { creatorId: userId },
      attributes: [
        [Capsule.sequelize.fn('strftime', '%Y-%m', Capsule.sequelize.col('createdAt')), 'month'],
        [Capsule.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['month'],
      order: [[Capsule.sequelize.fn('strftime', '%Y-%m', Capsule.sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      statistics: {
        totalCapsules,
        lockedCapsules,
        unlockedCapsules,
        totalViews,
        favoritesCount,
        nextUnlock: nextUnlock ? {
          title: nextUnlock.title,
          unlockDate: nextUnlock.unlockDate
        } : null,
        capsulesByMonth
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

exports.exportData = async (req, res) => {
  try {
    const capsules = await Capsule.findAll({
      where: { creatorId: req.user.userId },
      include: [
        { model: Category, as: 'category', required: false },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });

    const categories = await Category.findAll({
      where: { userId: req.user.userId }
    });

    const tags = await Tag.findAll({
      where: { userId: req.user.userId }
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: req.user.userId,
        email: req.user.email
      },
      capsules: capsules.map(c => c.toJSON()),
      categories: categories.map(c => c.toJSON()),
      tags: tags.map(t => t.toJSON())
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting data', error: error.message });
  }
};

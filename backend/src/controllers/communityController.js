const Capsule = require('../models/Capsule');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const User = require('../models/User');
const CapsuleView = require('../models/CapsuleView');
const CapsuleTag = require('../models/CapsuleTag');
const { Op } = require('sequelize');

exports.explorePublic = async (req, res) => {
  try {
    const { search, sort, page = 1 } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    const where = { isPrivate: false, isUnlocked: true };
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const order = sort === 'trending' ? 
      [['viewCount', 'DESC']] : 
      [['createdAt', 'DESC']];

    const capsules = await Capsule.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', required: false },
        { model: Tag, as: 'tags', through: { attributes: [] }, required: false }
      ],
      order,
      limit,
      offset
    });

    // Get like counts
    const capsulesWithStats = await Promise.all(
      capsules.rows.map(async (capsule) => {
        const likeCount = await Like.count({ where: { capsuleId: capsule.id } });
        const commentCount = await Comment.count({ where: { capsuleId: capsule.id } });
        return {
          ...capsule.toJSON(),
          likeCount,
          commentCount
        };
      })
    );

    res.json({
      capsules: capsulesWithStats,
      total: capsules.count,
      page: parseInt(page),
      pages: Math.ceil(capsules.count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error exploring capsules', error: error.message });
  }
};

exports.getCommunityStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalCapsules = await Capsule.count();
    const publicCapsules = await Capsule.count({ where: { isPrivate: false } });
    const unlockedToday = await Capsule.count({
      where: {
        isUnlocked: true,
        unlockDate: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const topTags = await CapsuleTag.findAll({
      attributes: ['tagId'],
      raw: true,
      group: ['tagId'],
      order: [[sequelize.fn('COUNT', sequelize.col('tagId')), 'DESC']],
      limit: 5
    });

    res.json({
      totalUsers,
      totalCapsules,
      publicCapsules,
      capsulesUnlockedToday: unlockedToday,
      topTags
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching community stats', error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'capsules' } = req.query;

    let leaderboard;

    if (type === 'capsules') {
      leaderboard = await Capsule.findAll({
        attributes: [
          'creatorId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalCapsules']
        ],
        group: ['creatorId'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });
    } else if (type === 'likes') {
      leaderboard = await Like.findAll({
        attributes: [
          [sequelize.col('Capsule.creatorId'), 'creatorId'],
          [sequelize.fn('COUNT', sequelize.col('Like.id')), 'totalLikes']
        ],
        include: [{
          model: Capsule,
          attributes: [],
          required: true
        }],
        group: ['Capsule.creatorId'],
        order: [[sequelize.fn('COUNT', sequelize.col('Like.id')), 'DESC']],
        limit: 10,
        raw: true
      });
    }

    // Get user info for leaderboard
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await User.findByPk(entry.creatorId, {
          attributes: ['id', 'username', 'email']
        });
        return {
          ...entry,
          user: user?.toJSON()
        };
      })
    );

    res.json({ leaderboard: leaderboardWithUsers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

exports.trackView = async (req, res) => {
  try {
    const { capsuleId } = req.body;
    const userId = req.user.userId;

    const capsule = await Capsule.findByPk(capsuleId);
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    // Create view record
    await CapsuleView.create({ userId, capsuleId });

    // Update view count
    capsule.viewCount = (capsule.viewCount || 0) + 1;
    await capsule.save();

    res.json({ message: 'View tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking view', error: error.message });
  }
};

exports.getTrendingTechs = async (req, res) => {
  try {
    // Get trending tags based on capsule count
    const trendingTags = await Tag.findAll({
      attributes: [
        'id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('capsules.id')), 'mentions']
      ],
      include: [{
        model: Capsule,
        as: 'capsules',
        attributes: [],
        through: { attributes: [] }
      }],
      group: ['Tag.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('capsules.id')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({ trending: trendingTags });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trending techs', error: error.message });
  }
};

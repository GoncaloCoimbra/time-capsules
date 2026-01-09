const Like = require('../models/Like');
const Capsule = require('../models/Capsule');
const { Op } = require('sequelize');
const Notification = require('../models/Notification');

exports.toggleLike = async (req, res) => {
  try {
    const { capsuleId } = req.body;
    const userId = req.user.userId;

    const capsule = await Capsule.findByPk(capsuleId);
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    const existingLike = await Like.findOne({
      where: { userId, capsuleId }
    });

    if (existingLike) {
      await existingLike.destroy();
      // Optionally remove related notification
      await Notification.destroy({ where: { actorId: userId, capsuleId, type: 'like' } }).catch(() => {});
      return res.json({ message: 'Like removed', liked: false });
    } else {
      await Like.create({ userId, capsuleId });
      // notify owner
      if (capsule.creatorId !== userId) {
        await Notification.create({
          userId: capsule.creatorId,
          actorId: userId,
          type: 'like',
          capsuleId
        }).catch(() => {});
      }

      return res.json({ message: 'Like added', liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

exports.getLikesCount = async (req, res) => {
  try {
    const { capsuleId } = req.params;

    const count = await Like.count({
      where: { capsuleId }
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching likes count', error: error.message });
  }
};

exports.isLiked = async (req, res) => {
  try {
    const { capsuleId } = req.params;
    const userId = req.user.userId;

    const like = await Like.findOne({
      where: { userId, capsuleId }
    });

    res.json({ liked: !!like });
  } catch (error) {
    res.status(500).json({ message: 'Error checking like', error: error.message });
  }
};

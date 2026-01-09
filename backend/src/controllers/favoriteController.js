const Favorite = require('../models/Favorite');
const Capsule = require('../models/Capsule');
const Notification = require('../models/Notification');

exports.toggleFavorite = async (req, res) => {
  try {
    const { capsuleId } = req.body;
    const userId = req.user.userId;

    const capsule = await Capsule.findByPk(capsuleId);
    if (!capsule) return res.status(404).json({ message: 'Capsule not found' });

    if (capsule.isPrivate && capsule.creatorId !== userId) {
      return res.status(403).json({ message: 'Cannot favorite private capsule' });
    }

    const existing = await Favorite.findOne({ where: { userId, capsuleId } });
    if (existing) {
      await existing.destroy();
      await Notification.destroy({ where: { actorId: userId, capsuleId, type: 'favorite' } }).catch(() => {});
      return res.json({ message: 'Unfavorited', favorited: false });
    }

    await Favorite.create({ userId, capsuleId });
    if (capsule.creatorId !== userId) {
      await Notification.create({ userId: capsule.creatorId, actorId: userId, type: 'favorite', capsuleId }).catch(() => {});
    }
    return res.json({ message: 'Favorited', favorited: true });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling favorite', error: error.message });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.findAll({ where: { userId } });
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
};

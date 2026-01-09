const Follow = require('../models/Follow');
const Notification = require('../models/Notification');

exports.toggleFollow = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { targetId } = req.body;

    if (!targetId) return res.status(400).json({ message: 'targetId required' });
    if (followerId === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });

    const existing = await Follow.findOne({ where: { followerId, followingId: targetId } });
    if (existing) {
      await existing.destroy();
      await Notification.destroy({ where: { actorId: followerId, userId: targetId, type: 'follow' } }).catch(() => {});
      return res.json({ message: 'Unfollowed', following: false });
    }

    await Follow.create({ followerId, followingId: targetId });
    await Notification.create({ userId: targetId, actorId: followerId, type: 'follow' }).catch(() => {});
    return res.json({ message: 'Followed', following: true });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling follow', error: error.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Follow.findAll({ where: { followerId: userId } });
    res.json({ following });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching following', error: error.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Follow.findAll({ where: { followingId: userId } });
    res.json({ followers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching followers', error: error.message });
  }
};

const Notification = require('../models/Notification');

exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const n = await Notification.findOne({ where: { id, userId } });
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    n.read = true;
    await n.save();
    res.json({ message: 'Marked read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification read', error: error.message });
  }
};

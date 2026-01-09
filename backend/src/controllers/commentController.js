const Comment = require('../models/Comment');
const Capsule = require('../models/Capsule');
const User = require('../models/User');

exports.addComment = async (req, res) => {
  try {
    const capsuleId = req.params.capsuleId;
    const { content } = req.body;
    const userId = req.user.userId;

    const capsule = await Capsule.findByPk(capsuleId);
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    if (capsule.isPrivate && capsule.creatorId !== userId) {
      return res.status(403).json({ message: 'Cannot comment on private capsule' });
    }

    const comment = await Comment.create({
      content,
      userId,
      capsuleId,
      username: req.user.username
    });

    // Create notification for capsule owner if commenter is not the owner
    const Notification = require('../models/Notification');
    if (capsule.creatorId !== userId) {
      await Notification.create({
        userId: capsule.creatorId,
        actorId: userId,
        type: 'comment',
        capsuleId,
        meta: { commentId: comment.id, text: content }
      });
    }

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { capsuleId } = req.params;

    const comments = await Comment.findAll({
      where: { capsuleId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

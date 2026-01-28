const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const FollowRequest = require('../models/FollowRequest');
const User = require('../models/User');

exports.toggleFollow = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { targetId } = req.body;

    if (!targetId) return res.status(400).json({ message: 'targetId required' });
    if (followerId === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });

    // Verifica se o utilizador alvo tem conta privada
    const targetUser = await User.findByPk(targetId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Se a conta é privada, cria um pedido em vez de seguir diretamente
    if (targetUser.isPrivate) {
      const existingRequest = await FollowRequest.findOne({
        where: { requesterId: followerId, targetId }
      });

      if (existingRequest) {
        await existingRequest.destroy();
        return res.json({ message: 'Follow request cancelled', following: false });
      }

      await FollowRequest.create({ requesterId: followerId, targetId });
      await Notification.create({
        userId: targetId,
        actorId: followerId,
        type: 'follow_request'
      }).catch(() => {});

      return res.json({ message: 'Follow request sent', following: false, requestPending: true });
    }

    // Se a conta é pública, segue normalmente
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

/**
 * Obtém lista de utilizadores que um utilizador está a seguir
 */
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [{
        model: Follow,
        as: 'following',
        attributes: [],
        through: { attributes: [] },
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar', 'bio']
        }]
      }]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Extrair os utilizadores seguidos
    const following = user.following?.map(f => ({
      id: f.followingId,
      username: f.User?.username,
      avatar: f.User?.avatar,
      bio: f.User?.bio
    })) || [];

    res.json({ following });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching following', error: error.message });
  }
};

/**
 * Obtém lista de seguidores de um utilizador
 */
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const follows = await Follow.findAll({
      where: { followingId: userId },
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar', 'bio']
      }]
    });

    res.json({ followers: follows.map(f => ({
      id: f.followerId,
      username: f.User?.username,
      avatar: f.User?.avatar,
      bio: f.User?.bio
    })) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching followers', error: error.message });
  }
};

/**
 * Obtém pedidos de seguimento pendentes do utilizador autenticado
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await FollowRequest.findAll({
      where: { targetId: userId, status: 'pending' },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'avatar', 'bio']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Formata a resposta
    const formattedRequests = requests.map(req => ({
      id: req.requesterId,
      username: req.requester?.username || 'Utilizador',
      avatar: req.requester?.avatar || null,
      bio: req.requester?.bio || null,
      createdAt: req.createdAt
    }));

    res.json({ requests: formattedRequests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending requests', error: error.message });
  }
};

/**
 * Aprova um pedido de seguimento pendente
 */
exports.approvePendingRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requesterId } = req.params;

    // Encontra e atualiza o pedido
    const followRequest = await FollowRequest.findOne({
      where: { requesterId, targetId: userId, status: 'pending' }
    });

    if (!followRequest) {
      return res.status(404).json({ message: 'Follow request not found' });
    }

    // Cria a relação de seguimento
    await Follow.findOrCreate({
      where: { followerId: requesterId, followingId: userId }
    });

    // Marca o pedido como aprovado
    await followRequest.update({ status: 'approved' });

    // Notifica o requerente
    await Notification.create({
      userId: requesterId,
      actorId: userId,
      type: 'follow_approved'
    }).catch(() => {});

    res.json({ message: 'Follow request approved', approved: true });
  } catch (error) {
    res.status(500).json({ message: 'Error approving request', error: error.message });
  }
};

/**
 * Rejeita um pedido de seguimento pendente
 */
exports.rejectPendingRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requesterId } = req.params;

    // Encontra e remove o pedido
    const followRequest = await FollowRequest.findOne({
      where: { requesterId, targetId: userId, status: 'pending' }
    });

    if (!followRequest) {
      return res.status(404).json({ message: 'Follow request not found' });
    }

    await followRequest.update({ status: 'rejected' });

    res.json({ message: 'Follow request rejected', rejected: true });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
};

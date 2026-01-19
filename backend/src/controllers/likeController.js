// backend/controllers/likeController.js
const Like = require('../models/Like');
const Capsule = require('../models/Capsule');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

// Toggle reaction (adiciona ou remove)
exports.toggleReaction = async (req, res) => {
  try {
    const { capsuleId, commentId, reactionType } = req.body;
    const userId = req.user.userId;

    // Validar tipo de reação
    const validReactions = ['like', 'love', 'fire', 'idea', 'laugh', 'wow', 'celebrate', 'clap'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: 'Tipo de reação inválido' });
    }

    // Verificar se é para cápsula ou comentário
    if (!capsuleId && !commentId) {
      return res.status(400).json({ message: 'capsuleId ou commentId é obrigatório' });
    }

    // Verificar se o recurso existe
    if (capsuleId) {
      const capsule = await Capsule.findByPk(capsuleId);
      if (!capsule) {
        return res.status(404).json({ message: 'Cápsula não encontrada' });
      }
    }

    if (commentId) {
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comentário não encontrado' });
      }
    }

    // Verificar se o usuário já reagiu com este tipo
    const where = { userId, reactionType };
    if (capsuleId) where.capsuleId = capsuleId;
    if (commentId) where.commentId = commentId;

    const existingReaction = await Like.findOne({ where });

    if (existingReaction) {
      // Remove a reação
      await existingReaction.destroy();
      
      // Remove notificação relacionada
      const notifWhere = { 
        actorId: userId, 
        type: 'reaction',
        metadata: { reactionType }
      };
      if (capsuleId) notifWhere.capsuleId = capsuleId;
      if (commentId) notifWhere.commentId = commentId;
      
      await Notification.destroy({ where: notifWhere }).catch(() => {});

      return res.json({ 
        message: 'Reação removida', 
        reacted: false,
        reactionType 
      });
    } else {
      // Adiciona a reação
      const newReaction = await Like.create({ 
        userId, 
        capsuleId: capsuleId || null,
        commentId: commentId || null,
        reactionType 
      });

      // Criar notificação para o dono
      let ownerId;
      if (capsuleId) {
        const capsule = await Capsule.findByPk(capsuleId);
        ownerId = capsule.creatorId;
      } else if (commentId) {
        const comment = await Comment.findByPk(commentId);
        ownerId = comment.userId;
      }

      if (ownerId && ownerId !== userId) {
        await Notification.create({
          userId: ownerId,
          actorId: userId,
          type: 'reaction',
          capsuleId: capsuleId || null,
          commentId: commentId || null,
          metadata: { reactionType }
        }).catch(() => {});
      }

      return res.json({ 
        message: 'Reação adicionada', 
        reacted: true,
        reactionType,
        reaction: newReaction
      });
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ 
      message: 'Erro ao processar reação', 
      error: error.message 
    });
  }
};

// Obter contagem de reações agrupadas por tipo
exports.getReactionsSummary = async (req, res) => {
  try {
    const { capsuleId, commentId } = req.params;

    if (!capsuleId && !commentId) {
      return res.status(400).json({ message: 'capsuleId ou commentId é obrigatório' });
    }

    const where = {};
    if (capsuleId) where.capsuleId = capsuleId;
    if (commentId) where.commentId = commentId;

    // Buscar todas as reações
    const reactions = await Like.findAll({
      where,
      attributes: ['reactionType', 'userId']
    });

    // Agrupar por tipo
    const summary = reactions.reduce((acc, reaction) => {
      const type = reaction.reactionType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          users: []
        };
      }
      acc[type].count++;
      acc[type].users.push(reaction.userId);
      return acc;
    }, {});

    res.json({ 
      summary,
      total: reactions.length 
    });
  } catch (error) {
    console.error('Error fetching reactions summary:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar reações', 
      error: error.message 
    });
  }
};

// Verificar quais reações o usuário deu
exports.getUserReactions = async (req, res) => {
  try {
    const { capsuleId, commentId } = req.params;
    const userId = req.user.userId;

    if (!capsuleId && !commentId) {
      return res.status(400).json({ message: 'capsuleId ou commentId é obrigatório' });
    }

    const where = { userId };
    if (capsuleId) where.capsuleId = capsuleId;
    if (commentId) where.commentId = commentId;

    const userReactions = await Like.findAll({
      where,
      attributes: ['reactionType']
    });

    const reactionTypes = userReactions.map(r => r.reactionType);

    res.json({ 
      reactions: reactionTypes 
    });
  } catch (error) {
    console.error('Error fetching user reactions:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar reações do usuário', 
      error: error.message 
    });
  }
};

// Compatibilidade com sistema antigo de likes simples
exports.toggleLike = async (req, res) => {
  try {
    const { capsuleId } = req.body;
    req.body.reactionType = 'like';
    return exports.toggleReaction(req, res);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao processar like', 
      error: error.message 
    });
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
    res.status(500).json({ 
      message: 'Erro ao buscar contagem de likes', 
      error: error.message 
    });
  }
};

exports.isLiked = async (req, res) => {
  try {
    const { capsuleId } = req.params;
    const userId = req.user.userId;

    const like = await Like.findOne({
      where: { userId, capsuleId, reactionType: 'like' }
    });

    res.json({ liked: !!like });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao verificar like', 
      error: error.message 
    });
  }
};
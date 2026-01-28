const Capsule = require('../models/Capsule');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const User = require('../models/User');
const CapsuleView = require('../models/CapsuleView');
const CapsuleTag = require('../models/CapsuleTag');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// FUNÇÃO CORRIGIDA - NÃO MOSTRAR PRÓPRIAS CÁPSULAS NA EXPLORAÇÃO PÚBLICA
exports.explorePublic = async (req, res) => {
  try {
    const { search, sort, page = 1, creator, limit: queryLimit } = req.query;
    const limit = parseInt(queryLimit) || 12;
    const offset = (page - 1) * limit;

    // Cápsulas públicas E desbloqueadas
    const where = { 
      isPrivate: false, 
      isUnlocked: true 
    };
  
    if (creator) {
      // Se um criador específico foi solicitado, filtrar por ele
      where.creatorId = creator;
      console.log(`🔍 Explorando cápsulas públicas DO CRIADOR: ${creator}`);
    } else if (req.user?.userId) {
      // Se NENHUM criador foi especificado, EXCLUIR as próprias cápsulas
      where.creatorId = { [Op.ne]: req.user.userId };
      console.log(`🌍 Explorando cápsulas públicas (EXCLUINDO próprias do usuário ${req.user.userId})`);
    } else {
      console.log('🌍 Explorando TODAS as cápsulas públicas (usuário não autenticado)');
    }
    
    console.log('🔍 explorePublic WHERE:', JSON.stringify(where, null, 2));
    
    // Filtrar por busca
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Definir ordenação
    const order = sort === 'trending' ? 
      [['viewCount', 'DESC'], ['createdAt', 'DESC']] : 
      [['createdAt', 'DESC']];

    const capsules = await Capsule.findAndCountAll({
      where,
      include: [
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
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatar', 'bio', 'createdAt'],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    });

    console.log('📦 Found capsules:', capsules.count);
    console.log('📦 Capsules on this page:', capsules.rows.length);
    
    // Log creators to verify different users
    const creators = [...new Set(capsules.rows.map(c => c.creatorId))];
    console.log('👥 Unique creators:', creators);
    
    // VERIFICAÇÃO ADICIONAL: Garantir que nenhuma cápsula própria está sendo retornada
    if (req.user?.userId && !creator) {
      const ownCapsules = capsules.rows.filter(c => c.creatorId === req.user.userId);
      if (ownCapsules.length > 0) {
        console.error('⚠️ ERRO: Cápsulas próprias encontradas na exploração pública!', ownCapsules.map(c => c.id));
      }
    }

    // Enriquecer com estatísticas e metadata consistente
    const capsulesWithStats = await Promise.all(
      capsules.rows.map(async (capsule) => {
        const likeCount = await Like.count({ where: { capsuleId: capsule.id } });
        const commentCount = await Comment.count({ where: { capsuleId: capsule.id } });
        
        const capsuleData = capsule.toJSON();
        const creator = capsuleData.creator || {};
        
        // Garantir metadata consistente
        const metadata = {
          author: creator.username || 'Usuário Anônimo',
          authorAvatar: creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${capsule.creatorId || 'default'}`,
          authorBio: creator.bio || ''
        };
        
        return {
          ...capsuleData,
          // Manter ambos para compatibilidade
          User: creator,
          creator: creator,
          metadata,
          likeCount,
          commentCount,
          likes: likeCount,
          comments: commentCount
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
    console.error('Error in explorePublic:', error);
    res.status(500).json({ 
      message: 'Error exploring capsules', 
      error: error.message 
    });
  }
};

exports.getCommunityStats = async (req, res) => {
  try {
    console.log('📊 Fetching community stats...');
    const totalUsers = await User.count();
    const totalCapsules = await Capsule.count();
    const publicCapsules = await Capsule.count({ where: { isPrivate: false } });
    
    console.log('📊 Stats loaded: users=' + totalUsers + ', capsules=' + totalCapsules);
    
    const unlockedToday = await Capsule.count({
      where: {
        isUnlocked: true,
        unlockDate: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Safely fetch top tags, with fallback to empty if fails
    let topTags = [];
    try {
      topTags = await CapsuleTag.findAll({
        attributes: [
          'tagId',
          [sequelize.fn('COUNT', sequelize.col('tagId')), 'count']
        ],
        group: ['tagId'],
        order: [[sequelize.fn('COUNT', sequelize.col('tagId')), 'DESC']],
        limit: 5,
        raw: true,
        subQuery: false
      });
    } catch (tagError) {
      console.warn('⚠️ Could not fetch top tags:', tagError.message);
      topTags = [];
    }

    res.json({
      totalUsers,
      totalCapsules,
      totalPublicCapsules: publicCapsules,
      publicCapsules,
      capsulesUnlockedToday: unlockedToday,
      topTags
    });
  } catch (error) {
    console.error('Error in getCommunityStats:', error);
    res.status(500).json({ 
      message: 'Error fetching community stats', 
      error: error.message 
    });
  }
};

// SISTEMA DE PONTUAÇÃO COMPLETO COM LEADERBOARD
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 50 } = req.query;
    const queryLimit = parseInt(limit);

    // Definir filtro de período
    let dateFilter = {};
    if (period === 'today') {
      dateFilter = {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = {
        createdAt: {
          [Op.gte]: weekAgo
        }
      };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = {
        createdAt: {
          [Op.gte]: monthAgo
        }
      };
    }

    // Buscar todos os usuários com cápsulas públicas
    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'email',
        'avatar',
        'bio',
        'createdAt'
      ],
      include: [
        {
          model: Capsule,
          as: 'capsules',
          where: { isPrivate: false },
          attributes: ['id', 'viewCount'],
          required: false,
          include: [
            {
              model: Like,
              as: 'likes',
              attributes: ['id'],
              required: false
            },
            {
              model: CapsuleView,
              as: 'views',
              attributes: ['id'],
              required: false,
              where: dateFilter
            }
          ]
        }
      ]
    });

    // Calcular pontuação para cada usuário
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const capsules = user.capsules || [];
        
        // Contagens
        const totalCapsules = capsules.length;
        const totalLikes = capsules.reduce((sum, capsule) => 
          sum + (capsule.likes ? capsule.likes.length : 0), 0);
        const totalViews = capsules.reduce((sum, capsule) => 
          sum + (capsule.viewCount || 0), 0);
        
        // Calcular pontuação
        // 10 pontos por cápsula criada
        // 1 ponto por like recebido
        // 0.5 pontos por visualização
        const score = Math.round(
          (totalCapsules * 10) + 
          (totalLikes * 1) + 
          (totalViews * 0.5)
        );

        return {
          userId: user.id,
          username: user.username,
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          bio: user.bio || 'Explorador de cápsulas temporais',
          totalCapsules,
          totalLikes,
          totalViews,
          score,
          joinDate: user.createdAt,
          // Dados para o perfil
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            createdAt: user.createdAt
          }
        };
      })
    );

    // Ordenar por pontuação (mais alta primeiro)
    leaderboardData.sort((a, b) => b.score - a.score);

    // Aplicar limite
    const limitedLeaderboard = leaderboardData.slice(0, queryLimit);

    // Adicionar ranking
    const leaderboardWithRanking = limitedLeaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankBadge: index === 0 ? '🥇' : 
                index === 1 ? '🥈' : 
                index === 2 ? '🥉' : 
                `#${index + 1}`
    }));

    res.json({
      leaderboard: leaderboardWithRanking,
      period,
      totalUsers: leaderboardData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    res.status(500).json({ 
      message: 'Error fetching leaderboard', 
      error: error.message 
    });
  }
};

//  Obter estatísticas detalhadas de um usuário específico
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'avatar', 'bio', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Estatísticas do usuário
    const capsules = await Capsule.findAll({
      where: { 
        creatorId: userId,
        isPrivate: false 
      },
      attributes: ['id', 'viewCount', 'createdAt']
    });

    const totalCapsules = capsules.length;
    
    // Contar likes totais
    let totalLikes = 0;
    for (const capsule of capsules) {
      const likes = await Like.count({ where: { capsuleId: capsule.id } });
      totalLikes += likes;
    }

    // Contar visualizações totais
    const totalViews = capsules.reduce((sum, capsule) => 
      sum + (capsule.viewCount || 0), 0);

    // Calcular pontuação
    const score = Math.round(
      (totalCapsules * 10) + 
      (totalLikes * 1) + 
      (totalViews * 0.5)
    );

    // Cápsulas mais populares
    const popularCapsules = await Capsule.findAll({
      where: { 
        creatorId: userId,
        isPrivate: false 
      },
      order: [['viewCount', 'DESC']],
      limit: 5,
      include: [
        {
          model: Like,
          as: 'likes',
          attributes: ['id']
        }
      ]
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        bio: user.bio,
        joinDate: user.createdAt
      },
      stats: {
        totalCapsules,
        totalLikes,
        totalViews,
        score,
        avgViewsPerCapsule: totalCapsules > 0 ? (totalViews / totalCapsules).toFixed(1) : 0,
        avgLikesPerCapsule: totalCapsules > 0 ? (totalLikes / totalCapsules).toFixed(1) : 0
      },
      popularCapsules: popularCapsules.map(capsule => ({
        id: capsule.id,
        title: capsule.title,
        viewCount: capsule.viewCount,
        likeCount: capsule.likes ? capsule.likes.length : 0
      }))
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({ 
      message: 'Error fetching user stats', 
      error: error.message 
    });
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

    // Verificar se já visualizou recentemente (últimos 5 minutos)
    const recentView = await CapsuleView.findOne({
      where: {
        userId,
        capsuleId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    });

    if (!recentView) {
      // Criar registro de visualização
      await CapsuleView.create({ userId, capsuleId });

      // Atualizar contador
      capsule.viewCount = (capsule.viewCount || 0) + 1;
      await capsule.save();

      // O usuário que visualizou ganha 0.5 pontos automaticamente
      // Esta pontuação será calculada dinamicamente no leaderboard
      console.log(`📊 Pontuação atualizada: +0.5 pontos para visualização da cápsula ${capsuleId}`);
    }

    res.json({ 
      message: 'View tracked',
      viewCount: capsule.viewCount
    });
  } catch (error) {
    console.error('Error in trackView:', error);
    res.status(500).json({ 
      message: 'Error tracking view', 
      error: error.message 
    });
  }
};

const Vote = require('../models/Vote');

exports.vote = async (req, res) => {
  try {
    const { capsuleId } = req.body;
    const userId = req.user.userId;

    const capsule = await Capsule.findByPk(capsuleId);
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    // Toggle vote
    const existingVote = await Vote.findOne({ 
      where: { userId, capsuleId } 
    });
    
    let voted = true;
    
    if (existingVote) {
      await existingVote.destroy();
      voted = false;
    } else {
      await Vote.create({ userId, capsuleId });
      voted = true;
      
      // O criador da cápsula ganha 1 ponto por like
      // Esta pontuação será calculada dinamicamente no leaderboard
      console.log(`📊 Pontuação atualizada: +1 ponto para like na cápsula ${capsuleId} do criador ${capsule.creatorId}`);
    }

    const votes = await Vote.count({ where: { capsuleId } });

    res.json({ 
      message: voted ? 'Voted' : 'Vote removed', 
      voted, 
      votes 
    });
  } catch (error) {
    console.error('Error in vote:', error);
    res.status(500).json({ 
      message: 'Error processing vote', 
      error: error.message 
    });
  }
};

exports.getTrendingTechs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Buscar tags mais usadas em cápsulas públicas
    const trendingTags = await Tag.findAll({
      attributes: [
        'id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('capsules.id')), 'mentions'],
        [sequelize.fn('COUNT', sequelize.col('capsules.id')), 'count']
      ],
      include: [{
        model: Capsule,
        as: 'capsules',
        attributes: [],
        where: { isPrivate: false },
        through: { attributes: [] },
        required: true
      }],
      group: ['Tag.id', 'Tag.name'],
      order: [[sequelize.fn('COUNT', sequelize.col('capsules.id')), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });

    res.json({ 
      trending: trendingTags,
      count: trendingTags.length
    });
  } catch (error) {
    console.error('Error in getTrendingTechs:', error);
    res.status(500).json({ 
      message: 'Error fetching trending techs', 
      error: error.message 
    });
  }
};

//  Calcular pontuação em tempo real para uma cápsula
exports.getCapsuleScore = async (req, res) => {
  try {
    const { capsuleId } = req.params;

    const capsule = await Capsule.findByPk(capsuleId, {
      include: [
        {
          model: Like,
          as: 'likes',
          attributes: ['id']
        }
      ]
    });

    if (!capsule) {
      return res.status(404).json({ message: 'Cápsula não encontrada' });
    }

    const likeCount = capsule.likes ? capsule.likes.length : 0;
    const viewCount = capsule.viewCount || 0;
    
    // Pontuação da cápsula: 10 pontos base + 1 por like + 0.5 por view
    const capsuleScore = 10 + (likeCount * 1) + (viewCount * 0.5);

    res.json({
      capsuleId,
      basePoints: 10,
      likePoints: likeCount * 1,
      viewPoints: viewCount * 0.5,
      totalScore: Math.round(capsuleScore * 10) / 10, // Arredondar para 1 decimal
      likeCount,
      viewCount
    });
  } catch (error) {
    console.error('Error in getCapsuleScore:', error);
    res.status(500).json({ 
      message: 'Error calculating capsule score', 
      error: error.message 
    });
  }
};
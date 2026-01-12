const Capsule = require('../models/Capsule');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const CapsuleTag = require('../models/CapsuleTag');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Favorite = require('../models/Favorite');
const CapsuleView = require('../models/CapsuleView');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sequelize = require('../models/index');
const { Op } = require('sequelize');

// Função auxiliar para verificar e desbloquear cápsulas
const checkAndUnlockCapsules = async (userId) => {
  try {
    const now = new Date();
    const result = await Capsule.update(
      { isUnlocked: true },
      {
        where: {
          creatorId: userId,
          isUnlocked: false,
          unlockDate: { [Op.lte]: now }
        }
      }
    );
    
    if (result[0] > 0) {
      console.log(`✓ ${result[0]} cápsula(s) desbloqueada(s) para o usuário ${userId}`);
    }
    
    return result[0];
  } catch (error) {
    console.error('Erro ao desbloquear cápsulas:', error);
    return 0;
  }
};

// Criar categorias padrão para novos usuários
const createDefaultCategories = async (userId) => {
  const defaultCategories = [
    { name: 'Pessoal', color: '#e2b714', userId },
    { name: 'Trabalho', color: '#1f7a8c', userId },
    { name: 'Ideias', color: '#ff6b6b', userId },
    { name: 'Metas', color: '#4ecdc4', userId },
    { name: 'Memórias', color: '#95a5a6', userId }
  ];

  try {
    const existingCategories = await Category.findAll({ where: { userId } });
    
    if (existingCategories.length === 0) {
      await Category.bulkCreate(defaultCategories);
      console.log(`✓ Categorias padrão criadas para o usuário ${userId}`);
    }
  } catch (error) {
    console.error('Erro ao criar categorias padrão:', error);
  }
};

exports.createCapsule = async (req, res) => {
  try {
    const { title, content, unlockDate, categoryId, isPrivate, color, reminder, tags } = req.body;

    // Criar categorias padrão se não existirem
    await createDefaultCategories(req.user.userId);

    // BUSCAR DADOS DO USUÁRIO ATUAL
    const currentUser = await User.findByPk(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (categoryId) {
      const category = await Category.findOne({
        where: { id: categoryId, userId: req.user.userId }
      });
      if (!category) {
        return res.status(400).json({ message: 'Categoria inválida' });
      }
    }

    const capsule = await Capsule.create({
      title,
      content,
      unlockDate,
      categoryId: categoryId || null,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      color: color || '#e2b714',
      reminder: reminder || 0,
      creatorId: req.user.userId,
      // SALVAR METADATA DO AUTOR NO MOMENTO DA CRIAÇÃO
      metadata: {
        author: currentUser.username,
        authorAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`
      }
    });

    if (tags && tags.length > 0) {
      const capsuleTags = tags.map(tagId => ({
        capsuleId: capsule.id,
        tagId: tagId
      }));
      await CapsuleTag.bulkCreate(capsuleTags);
    }

    console.log(`✓ Cápsula criada: ${capsule.title} por ${currentUser.username}`);

    res.status(201).json({
      message: 'Cápsula criada com sucesso',
      capsule
    });
  } catch (error) {
    console.error('Erro ao criar cápsula:', error);
    res.status(500).json({ message: 'Erro ao criar cápsula', error: error.message });
  }
};

// ====== FUNÇÃO ATUALIZADA PARA MOSTRAR CÁPSULAS PÚBLICAS ======
exports.getCapsules = async (req, res) => {
  try {
    const { categoryId, status, tagId, scope } = req.query;
    
    // DESBLOQUEAR cápsulas automaticamente do usuário logado
    await checkAndUnlockCapsules(req.user.userId);
    
    // Criar categorias padrão se não existirem
    await createDefaultCategories(req.user.userId);
    
    // MUDANÇA PRINCIPAL: Ajustar o filtro baseado no scope
    let where = {};
    
    if (scope === 'public') {
      // Mostrar cápsulas públicas E desbloqueadas de TODOS os usuários (incluindo as suas)
      where = {
        isPrivate: false,
        isUnlocked: true
      };
    } else {
      // Padrão: mostrar TODAS as cápsulas do próprio usuário (públicas e privadas)
      where = { creatorId: req.user.userId };
    }
    
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
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'avatar'],
        required: true
      }
    ];

    if (tagId) {
      include[1].where = { id: tagId };
      include[1].required = true;
    }

    const capsulesRaw = await Capsule.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']]
    });

    const capsules = capsulesRaw.map(c => {
      const obj = c.toJSON();
      
      // PRIORIZAR METADATA SALVO, DEPOIS DADOS DO CREATOR
      let authorName = 'Usuário Desconhecido';
      let authorAvatar = null;
      let authorId = obj.creatorId;
      
      // 1. Verificar se tem metadata salvo
      if (obj.metadata?.author) {
        authorName = obj.metadata.author;
        authorAvatar = obj.metadata.authorAvatar;
      } 
      // 2. Se não, usar dados do creator do JOIN
      else if (obj.creator?.username) {
        authorName = obj.creator.username;
        authorAvatar = obj.creator.avatar;
        authorId = obj.creator.id;
      }
      
      // 3. Fallback para avatar padrão
      if (!authorAvatar) {
        authorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorId}`;
      }
      
      // Atualizar/criar metadata
      obj.metadata = {
        author: authorName,
        authorAvatar: authorAvatar
      };
      
      console.log(`Cápsula ${obj.id}: autor=${authorName}, avatar=${authorAvatar}, creatorId=${authorId}`);
      
      return obj;
    });

    res.json({ capsules });
  } catch (error) {
    console.error('Erro ao buscar cápsulas:', error);
    res.status(500).json({ message: 'Erro ao buscar cápsulas', error: error.message });
  }
};

exports.getCapsuleById = async (req, res) => {
  try {
    // Desbloquear cápsulas antes de buscar
    await checkAndUnlockCapsules(req.user.userId);
    
    const capsule = await Capsule.findOne({
      where: {
        id: req.params.id,
        // Permitir visualizar se for do usuário OU se for pública e desbloqueada
        [Op.or]: [
          { creatorId: req.user.userId },
          { isPrivate: false, isUnlocked: true }
        ]
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
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });

    if (!capsule) {
      return res.status(404).json({ message: 'Cápsula não encontrada' });
    }

    // Verificar e desbloquear se necessário (apenas se for do próprio usuário)
    if (capsule.creatorId === req.user.userId) {
      const now = new Date();
      if (now >= capsule.unlockDate && !capsule.isUnlocked) {
        capsule.isUnlocked = true;
        await capsule.save();
        console.log(`✓ Cápsula ${capsule.id} desbloqueada ao visualizar`);
      }
    }

    await capsule.update({
      viewCount: capsule.viewCount + 1,
      lastViewed: new Date()
    });

    res.json({ capsule });
  } catch (error) {
    console.error('Erro ao buscar cápsula:', error);
    res.status(500).json({ message: 'Erro ao buscar cápsula', error: error.message });
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
      return res.status(404).json({ message: 'Cápsula não encontrada' });
    }

    if (categoryId) {
      const category = await Category.findOne({
        where: { id: categoryId, userId: req.user.userId }
      });
      if (!category) {
        return res.status(400).json({ message: 'Categoria inválida' });
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

    res.json({ message: 'Cápsula atualizada com sucesso', capsule });
  } catch (error) {
    console.error('Erro ao atualizar cápsula:', error);
    res.status(500).json({ message: 'Erro ao atualizar cápsula', error: error.message });
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
      return res.status(404).json({ message: 'Cápsula não encontrada' });
    }

    await capsule.update({ isFavorite: !capsule.isFavorite });

    res.json({ message: 'Favorito alternado', capsule });
  } catch (error) {
    console.error('Erro ao alternar favorito:', error);
    res.status(500).json({ message: 'Erro ao alternar favorito', error: error.message });
  }
};

exports.deleteCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findOne({ where: { id: req.params.id, creatorId: req.user.userId } });
    if (!capsule) return res.status(404).json({ message: 'Cápsula não encontrada' });

    await sequelize.transaction(async (t) => {
      await CapsuleTag.destroy({ where: { capsuleId: req.params.id }, transaction: t });
      await Comment.destroy({ where: { capsuleId: req.params.id }, transaction: t });
      await Like.destroy({ where: { capsuleId: req.params.id }, transaction: t });
      await Favorite.destroy({ where: { capsuleId: req.params.id }, transaction: t });
      await CapsuleView.destroy({ where: { capsuleId: req.params.id }, transaction: t });
      await Notification.destroy({ where: { capsuleId: req.params.id }, transaction: t }).catch(() => {});

      await Capsule.destroy({ where: { id: req.params.id, creatorId: req.user.userId }, transaction: t });
    });

    console.log(`✓ Cápsula ${req.params.id} excluída com sucesso`);
    res.json({ message: 'Cápsula excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cápsula:', error);
    res.status(500).json({ message: 'Erro ao excluir cápsula', error: error.message });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await checkAndUnlockCapsules(userId);
    await createDefaultCategories(userId);
    
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
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
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
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({ message: 'Erro ao exportar dados', error: error.message });
  }
};
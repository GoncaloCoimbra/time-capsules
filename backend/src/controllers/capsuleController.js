const Capsule = require('../models/Capsule');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const CapsuleTag = require('../models/CapsuleTag');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Favorite = require('../models/Favorite');
const CapsuleView = require('../models/CapsuleView');
const FollowCapsule = require('../models/FollowCapsule');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sequelize = require('../models/index');
const { Op } = require('sequelize');

// Função auxiliar para verificar e desbloquear cápsulas
const checkAndUnlockCapsules = async (userId) => {
  try {
    const now = new Date();
    
    // Buscar cápsulas que devem ser desbloqueadas
    const capsulesToUnlock = await Capsule.findAll({
      where: {
        creatorId: userId,
        isUnlocked: false,
        unlockDate: { [Op.lte]: now }
      }
    });
    
    let unlockedCount = 0;
    
    // Desbloquear cada cápsula e registrar
    for (const capsule of capsulesToUnlock) {
      await capsule.update({ isUnlocked: true });
      unlockedCount++;
      
      console.log(`✓ Cápsula desbloqueada: "${capsule.title}" (ID: ${capsule.id}, Data: ${capsule.unlockDate})`);
      
      // Criar notificação ao desbloquear
      try {
        await Notification.create({
          userId: userId,
          type: 'capsule_unlocked',
          meta: {
            text: `Cápsula "${capsule.title}" foi desbloqueada!`,
            capsuleId: capsule.id
          }
        });
      } catch (notifError) {
        console.error('Erro ao criar notificação de desbloqueio:', notifError);
      }
    }
    
    if (unlockedCount > 0) {
      console.log(`✅ Total: ${unlockedCount} cápsula(s) desbloqueada(s) para o usuário ${userId}`);
    }
    
    return unlockedCount;
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
    const { title, content, unlockDate, categoryId, isPrivate, color, reminder, tags, codeSnippet, language } = req.body;

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
      codeSnippet: codeSnippet || null,
      language: language || null,
      creatorId: req.user.userId,
      // Guardar METADATA DO AUTOR NO MOMENTO DA CRIAÇÃO
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

// ====== FUNÇÃO getCapsules CORRIGIDA ======
exports.getCapsules = async (req, res) => {
  try {
    const { categoryId, status, tagId, scope } = req.query;
    const currentUserId = req.user.userId;
    
    console.log(`
🔍 ===== DEBUG GET CAPSULES =====
User ID: ${currentUserId}
Scope: ${scope || 'mine (default)'}
============================
    `);
    
    // DESBLOQUEAR cápsulas automaticamente do usuário logado
    await checkAndUnlockCapsules(currentUserId);
    
    // Criar categorias padrão se não existirem
    await createDefaultCategories(currentUserId);
    
    let where = {};
    
    if (scope === 'public') {
      // Cápsulas públicas de OUTROS usuários (NÃO as minhas)
      where = {
        isPrivate: false,
        creatorId: { [Op.ne]: currentUserId }
      };
      
      console.log('🌍 Carregando cápsulas públicas DE OUTROS');
    } else if (scope === 'myPublic') {
      // Minhas cápsulas PÚBLICAS apenas
      where = {
        creatorId: currentUserId,
        isPrivate: false
      };
      
      console.log('🌍 Carregando MINHAS cápsulas PÚBLICAS');
    } else {
      // Padrão: mostrar APENAS minhas cápsulas PRIVADAS
      where = { 
        creatorId: currentUserId,
        isPrivate: true
      };
      
      console.log('👤 Carregando APENAS MINHAS cápsulas PRIVADAS');
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

    console.log(`📊 Database Query - Cápsulas encontradas: ${capsulesRaw.length}`);
    capsulesRaw.forEach(c => {
      console.log(`  - Cápsula: "${c.title}", criador: ${c.creatorId}, privada: ${c.isPrivate}`);
    });

    const capsules = capsulesRaw.map(c => {
      const obj = c.toJSON();
      
      // GARANTIR que creatorId está sempre presente e correto
      const creatorId = obj.creatorId || obj.creator?.id;
      
      // PRIORIZAR METADATA SALVO, DEPOIS DADOS DO CREATOR
      let authorName = 'Usuário Desconhecido';
      let authorAvatar = null;
      
      // 1. Verificar se tem metadata salvo
      if (obj.metadata?.author) {
        authorName = obj.metadata.author;
        authorAvatar = obj.metadata.authorAvatar;
      } 
      // 2. Se não, usar dados do creator do JOIN
      else if (obj.creator?.username) {
        authorName = obj.creator.username;
        authorAvatar = obj.creator.avatar;
      }
      
      // 3. Fallback para avatar padrão
      if (!authorAvatar) {
        authorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorId}`;
      }
      
      // Atualizar/criar metadata
      obj.metadata = {
        author: authorName,
        authorAvatar: authorAvatar
      };
      
      //  IMPORTANTE: Garantir que creatorId está presente na resposta
      obj.creatorId = creatorId;
      
      console.log(`📦 Cápsula ${obj.id}: autor=${authorName}, creatorId=${creatorId}, isPrivate=${obj.isPrivate}, scope=${scope}`);
      
      return obj;
    });

    console.log(`
✅ ===== RESULTADO =====
Total de cápsulas retornadas: ${capsules.length}
User ID: ${currentUserId}
Scope: ${scope || 'mine'}
Criadores: ${[...new Set(capsules.map(c => c.creatorId))].join(', ')}
========================
    `);

    res.json({ capsules });
  } catch (error) {
    console.error('❌ Erro ao buscar cápsulas:', error);
    res.status(500).json({ message: 'Erro ao buscar cápsulas', error: error.message });
  }
};

// ====== ROTA ESPECÍFICA PARA MINHAS CÁPSULAS PÚBLICAS ======
exports.getMyPublicCapsules = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    console.log(`🌍 Buscando MINHAS cápsulas PÚBLICAS (User ${currentUserId})`);
    
    await checkAndUnlockCapsules(currentUserId);
    await createDefaultCategories(currentUserId);
    
    const capsules = await Capsule.findAll({
      where: {
        creatorId: currentUserId,
        isPrivate: false
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
          through: { attributes: [] },
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatar'],
          required: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Encontradas ${capsules.length} cápsulas públicas minhas`);
    res.json({ capsules });
  } catch (error) {
    console.error('❌ Erro ao buscar minhas cápsulas públicas:', error);
    res.status(500).json({ message: 'Erro ao buscar cápsulas', error: error.message });
  }
};

// ====== ROTA ESPECÍFICA PARA MINHAS CÁPSULAS PRIVADAS ======
exports.getMyPrivateCapsules = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    console.log(`🔒 Buscando MINHAS cápsulas PRIVADAS (User ${currentUserId})`);
    
    await checkAndUnlockCapsules(currentUserId);
    await createDefaultCategories(currentUserId);
    
    const capsules = await Capsule.findAll({
      where: {
        creatorId: currentUserId,
        isPrivate: true
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
          through: { attributes: [] },
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatar'],
          required: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Encontradas ${capsules.length} cápsulas privadas minhas`);
    res.json({ capsules });
  } catch (error) {
    console.error('❌ Erro ao buscar minhas cápsulas privadas:', error);
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

    // ✅ NOVA LÓGICA: Contar views apenas de outros utilizadores (não do criador)
    // Uma view por utilizador por cápsula
    const isCreator = capsule.creatorId === req.user.userId;
    
    if (!isCreator) {
      // Verificar se este utilizador já viu esta cápsula
      const existingView = await CapsuleView.findOne({
        where: {
          userId: req.user.userId,
          capsuleId: req.params.id
        }
      });
      
      // Se não viu antes, registar a view
      if (!existingView) {
        await CapsuleView.create({
          userId: req.user.userId,
          capsuleId: req.params.id
        });
        
        // Incrementar viewCount
        await capsule.increment('viewCount');
        
        console.log(`👁️ View registada: User ${req.user.userId} visualizou cápsula ${capsule.id}`);
      } else {
        console.log(`⏭️ Utilizador ${req.user.userId} já tinha visto esta cápsula - view não contabilizada`);
      }
    } else {
      console.log(`👤 Criador visualizando a própria cápsula - view não contabilizada`);
    }
    
    // Atualizar lastViewed para todos (criador e outros)
    await capsule.update({
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

// Seguir/Desfollowear uma cápsula
exports.toggleFollowCapsule = async (req, res) => {
  try {
    const { capsuleId } = req.params;
    const userId = req.user.userId;

    // Verificar se a cápsula existe
    const capsule = await Capsule.findByPk(capsuleId);
    if (!capsule) {
      return res.status(404).json({ message: 'Cápsula não encontrada' });
    }

    // Verificar se já segue
    const existing = await FollowCapsule.findOne({
      where: { userId, capsuleId }
    });

    if (existing) {
      // Remover seguimento
      await existing.destroy();
      res.json({ message: 'Deixou de seguir a cápsula', isFollowing: false });
    } else {
      // Adicionar seguimento
      await FollowCapsule.create({ userId, capsuleId });
      
      // Notificar o criador
      if (capsule.creatorId !== userId) {
        await Notification.create({
          userId: capsule.creatorId,
          type: 'capsule_followed',
          message: `Alguém começou a seguir a sua cápsula "${capsule.title}"`,
          capsuleId: capsuleId
        });
      }

      res.json({ message: 'Começou a seguir a cápsula', isFollowing: true });
    }
  } catch (error) {
    console.error('Erro ao seguir cápsula:', error);
    res.status(500).json({ message: 'Erro ao seguir cápsula', error: error.message });
  }
};

// Obter cápsulas que o utilizador segue
exports.getFollowedCapsules = async (req, res) => {
  try {
    const userId = req.user.userId;

    const followedCapsules = await FollowCapsule.findAll({
      where: { userId },
      include: [
        {
          model: Capsule,
          as: 'capsule',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'username', 'avatar'] },
            { model: Category, as: 'category' }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const capsules = followedCapsules.map(f => f.capsule?.toJSON()).filter(c => c);

    res.json({ capsules });
  } catch (error) {
    console.error('Erro ao obter cápsulas seguidas:', error);
    res.status(500).json({ message: 'Erro ao obter cápsulas seguidas', error: error.message });
  }
};

// Obter número de seguidores de uma cápsula
exports.getCapsuleFollowers = async (req, res) => {
  try {
    const { capsuleId } = req.params;

    const count = await FollowCapsule.count({
      where: { capsuleId }
    });

    res.json({ followersCount: count });
  } catch (error) {
    console.error('Erro ao obter seguidores:', error);
    res.status(500).json({ message: 'Erro ao obter seguidores', error: error.message });
  }
};

// Verificar se o utilizador segue uma cápsula
exports.isFollowingCapsule = async (req, res) => {
  try {
    const { capsuleId } = req.params;
    const userId = req.user.userId;

    const following = await FollowCapsule.findOne({
      where: { userId, capsuleId }
    });

    res.json({ isFollowing: !!following });
  } catch (error) {
    console.error('Erro ao verificar seguimento:', error);
    res.status(500).json({ message: 'Erro ao verificar seguimento', error: error.message });
  }
};

/**
 * ENDPOINT DE VERIFICAÇÃO E TESTE
 * Verifica o estado de todas as cápsulas do utilizador
 * Mostra quais estão prontas para desbloquear
 */
exports.checkUnlockStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    
    // Buscar todas as cápsulas do utilizador
    const allCapsules = await Capsule.findAll({
      where: { creatorId: userId },
      order: [['unlockDate', 'ASC']]
    });
    
    // Categorizar cápsulas
    const capsuleStatus = {
      locked: [],
      unlocked: [],
      readyToUnlock: [],
      pastDue: []
    };
    
    allCapsules.forEach(capsule => {
      const capsuleData = {
        id: capsule.id,
        title: capsule.title,
        isUnlocked: capsule.isUnlocked,
        unlockDate: capsule.unlockDate,
        timeRemaining: capsule.unlockDate - now,
        hoursUntilUnlock: ((capsule.unlockDate - now) / (1000 * 60 * 60)).toFixed(2)
      };
      
      if (capsule.isUnlocked) {
        capsuleStatus.unlocked.push(capsuleData);
      } else if (now >= capsule.unlockDate) {
        capsuleStatus.pastDue.push(capsuleData);
      } else if ((capsule.unlockDate - now) <= (24 * 60 * 60 * 1000)) {
        capsuleStatus.readyToUnlock.push(capsuleData);
      } else {
        capsuleStatus.locked.push(capsuleData);
      }
    });
    
    // Tentar desbloquear cápsulas pendentes
    const unlockedCount = await checkAndUnlockCapsules(userId);
    
    res.json({
      status: 'success',
      message: `Verificação concluída. ${unlockedCount} cápsula(s) desbloqueada(s).`,
      currentTime: now,
      summary: {
        total: allCapsules.length,
        unlocked: capsuleStatus.unlocked.length,
        locked: capsuleStatus.locked.length,
        readyToUnlock: capsuleStatus.readyToUnlock.length,
        pastDue: capsuleStatus.pastDue.length
      },
      capsules: capsuleStatus
    });
  } catch (error) {
    console.error('Erro ao verificar status de desbloqueio:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro ao verificar status de desbloqueio', 
      error: error.message 
    });
  }
};

/**
 * ENDPOINT DE TESTE
 * Força o desbloqueio de todas as cápsulas pendentes
 * APENAS PARA DESENVOLVIMENTO/TESTE
 */
exports.forceUnlockAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.warn(`⚠️ AVISO: Force unlock chamado para user ${userId}`);
    
    const unlocked = await Capsule.update(
      { isUnlocked: true },
      { where: { creatorId: userId, isUnlocked: false } }
    );
    
    res.json({
      status: 'success',
      message: `${unlocked[0]} cápsula(s) desbloqueada(s) à força`,
      count: unlocked[0]
    });
  } catch (error) {
    console.error('Erro ao forçar desbloqueio:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro ao forçar desbloqueio', 
      error: error.message 
    });
  }
};

/**
 * ENDPOINT PARA CORRIGIR DATA DE DESBLOQUEIO
 * Permite atualizar a data de desbloqueio de uma cápsula
 * Útil para testes e correções
 */
exports.updateUnlockDate = async (req, res) => {
  try {
    const { capsuleId, unlockDate } = req.body;
    const userId = req.user.userId;
    
    // Validar entrada
    if (!capsuleId || !unlockDate) {
      return res.status(400).json({ 
        status: 'error',
        message: 'capsuleId e unlockDate são obrigatórios' 
      });
    }
    
    const newDate = new Date(unlockDate);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Data inválida. Use formato ISO: 2026-01-27T15:19:00Z' 
      });
    }
    
    // Encontrar cápsula
    const capsule = await Capsule.findOne({
      where: {
        id: capsuleId,
        creatorId: userId
      }
    });
    
    if (!capsule) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Cápsula não encontrada' 
      });
    }
    
    const oldDate = capsule.unlockDate;
    
    // Atualizar data
    await capsule.update({ unlockDate: newDate });
    
    // Verificar se deveria estar desbloqueada
    if (newDate <= new Date() && !capsule.isUnlocked) {
      await capsule.update({ isUnlocked: true });
      
      // Criar notificação
      await Notification.create({
        userId: userId,
        type: 'capsule_unlocked',
        meta: { text: `Cápsula "${capsule.title}" foi desbloqueada!`, capsuleId: capsule.id }
      });
      
      console.log(`✓ Cápsula ${capsuleId} desbloqueada automaticamente`);
    }
    
    res.json({
      status: 'success',
      message: 'Data de desbloqueio atualizada com sucesso',
      capsule: {
        id: capsule.id,
        title: capsule.title,
        dataPreviaAnterior: oldDate,
        dataNovaDesbloqueio: newDate,
        desbloqueada: capsule.isUnlocked
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar data de desbloqueio:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro ao atualizar data de desbloqueio', 
      error: error.message 
    });
  }
};

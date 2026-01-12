const Category = require('../models/Category');

// Middleware para garantir que o usuário tenha categorias padrão
const ensureDefaultCategories = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return next();
    }

    const userId = req.user.userId;
    
    // Verificar se o usuário já tem categorias
    const existingCategories = await Category.findAll({ 
      where: { userId },
      limit: 1 
    });
    
    // Se não tiver categorias, criar as padrão
    if (existingCategories.length === 0) {
      const defaultCategories = [
        { name: 'Pessoal', color: '#e2b714', userId },
        { name: 'Trabalho', color: '#1f7a8c', userId },
        { name: 'Ideias', color: '#ff6b6b', userId },
        { name: ' Metas', color: '#4ecdc4', userId },
        { name: 'Memórias', color: '#95a5a6', userId },
        { name: 'Estudos', color: '#9b59b6', userId },
      ];

      await Category.bulkCreate(defaultCategories);
      console.log(`✓ 7 categorias padrão criadas para o usuário ${userId}`);
    }
    
    next();
  } catch (error) {
    console.error('Erro ao criar categorias padrão:', error);
    // Não bloquear a requisição se houver erro
    next();
  }
};

module.exports = ensureDefaultCategories;
const sequelize = require('../models/index');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    if (process.env.NODE_ENV === 'production') {
      await sequelize.sync({ alter: true });
      console.log('✓ Database synchronized (production mode - data preserved)');
    } 
   
    else if (process.env.FORCE_RECREATE === 'true') {
      console.log('⚠️  FORCE_RECREATE ativado: Apagando TODAS as tabelas...');
      await sequelize.sync({ force: true });
      console.log('✓ Database synchronized (tables recreated - DATA LOST!)');
    }
   
    else {
      try {
        if (sequelize.getDialect && sequelize.getDialect() === 'sqlite') {
          await sequelize.query('PRAGMA foreign_keys = OFF;');
          try {
            await sequelize.sync({ alter: true });
          } finally {
            await sequelize.query('PRAGMA foreign_keys = ON;');
          }
        } else {
          await sequelize.sync({ alter: true });
        }
        console.log('✓ Database synchronized (safe mode - data preserved)');
      } catch (syncError) {
        console.warn('⚠️ Sync error:', syncError.message);
        await sequelize.sync();
        console.log('✓ Database synchronized (fallback - data preserved)');
      }
    }

    // Adicionar colunas novas se necessário (sem apagar dados)
    await ensureColumns();
    
  } catch (error) {
    console.error('✗ Unable to connect to database:', error);
    process.exit(1);
  }
};

// Função auxiliar para adicionar colunas sem perder dados
const ensureColumns = async () => {
  try {
    const [cols] = await sequelize.query("PRAGMA table_info('Capsules');");
    const names = cols.map(c => c.name);

    if (!names.includes('codeSnippet')) {
      await sequelize.query("ALTER TABLE Capsules ADD COLUMN codeSnippet TEXT;");
      console.log('✓ Added column: Capsules.codeSnippet');
    }
    if (!names.includes('language')) {
      await sequelize.query("ALTER TABLE Capsules ADD COLUMN language VARCHAR;");
      console.log('✓ Added column: Capsules.language');
    }
  } catch (err) {
    console.warn('⚠️ Could not add columns:', err.message);
  }
};

module.exports = connectDB;
const sequelize = require('../models/index');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    // MODO SEGURO: Usamos 'alter: true' para atualizar a estrutura sem apagar os dados
    // Removemos o bloco 'FORCE_RECREATE' que estava a causar a perda de dados
    try {
      if (sequelize.getDialect && sequelize.getDialect() === 'sqlite') {
        // No SQLite, desativamos as chaves estrangeiras temporariamente para permitir alterações de tabela
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
      console.warn('⚠️ Sync error, falling back to basic sync:', syncError.message);
      await sequelize.sync();
    }

    // Garante que colunas específicas existam (retrocompatibilidade)
    await ensureColumns();
    
  } catch (error) {
    console.error('✗ Unable to connect to database:', error);
    process.exit(1);
  }
};


const ensureColumns = async () => {
  try {
    const [cols] = await sequelize.query("PRAGMA table_info('Capsules');");
    const names = cols.map(c => c.name);

    if (!names.includes('codeSnippet')) {
      await sequelize.query("ALTER TABLE Capsules ADD COLUMN codeSnippet TEXT;");
      console.log('✓ Added missing column: Capsules.codeSnippet');
    }
    if (!names.includes('language')) {
      await sequelize.query("ALTER TABLE Capsules ADD COLUMN language VARCHAR;");
      console.log('✓ Added missing column: Capsules.language');
    }
  } catch (err) {
    console.warn('⚠️ Could not verify/add columns:', err.message);
  }
};

module.exports = connectDB;
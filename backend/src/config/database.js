const sequelize = require('../models/index');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    // Attempt schema sync with safe fallbacks for SQLite
    try {
      if (sequelize.getDialect && sequelize.getDialect() === 'sqlite') {
        // Turn off foreign key checks while attempting ALTER operations
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        try {
          await sequelize.sync({ alter: true });
        } finally {
          // Ensure foreign keys are re-enabled even if alter fails
          await sequelize.query('PRAGMA foreign_keys = ON;');
        }
      } else {
        await sequelize.sync({ alter: true });
      }
      console.log('✓ Database synchronized');

      // Ensure new optional columns are present (safe ALTER for SQLite)
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
          console.warn('Could not auto-add missing columns to Capsules:', err && err.message ? err.message : err);
        }
      };

      await ensureColumns();
    } catch (syncError) {
      console.warn('⚠️ sequelize.sync({ alter: true }) failed:', syncError && syncError.message ? syncError.message : syncError);
      // Fallback: try a non-altering sync which may avoid SQLite's backup/copy step
      try {
        await sequelize.sync();
        console.log('✓ Database synchronized (fallback sync without alter)');

        // Try to ensure columns after fallback sync as well
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
            console.warn('Could not auto-add missing columns to Capsules:', err && err.message ? err.message : err);
          }
        };

        await ensureColumns();
      } catch (fallbackError) {
        // If configured explicitly, allow a destructive force sync (drops and recreates tables)
        if (process.env.ALLOW_SQLITE_FORCE === 'true') {
          console.warn('⚠️ Running destructive sync({ force: true }) because ALLOW_SQLITE_FORCE=true');
          await sequelize.sync({ force: true });
          console.log('✓ Database synchronized (forced)');
        } else {
          console.error('✗ Sync failed and fallback strategies exhausted. To allow destructive recovery set ALLOW_SQLITE_FORCE=true and restart, or inspect the DB and resolve unique constraint issues.');
          throw syncError;
        }
      }
    }
  } catch (error) {
    console.error('✗ Unable to connect to database:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

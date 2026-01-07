const sequelize = require('../models/index');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');
    await sequelize.sync({ alter: true });
    console.log('✓ Database synchronized');
  } catch (error) {
    console.error('✗ Unable to connect to database:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

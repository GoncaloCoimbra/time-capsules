const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  capsuleId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'capsuleId']
    }
  ]
});

module.exports = Vote;

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  followerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  followingId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['followerId', 'followingId'] }
  ]
});

module.exports = Follow;

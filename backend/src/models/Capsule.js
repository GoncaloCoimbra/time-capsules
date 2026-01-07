const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Capsule = sequelize.define('Capsule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  unlockDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isUnlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastViewed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1'
  },
  reminder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Days before unlock to send reminder'
  }
}, {
  timestamps: true
});

module.exports = Capsule;

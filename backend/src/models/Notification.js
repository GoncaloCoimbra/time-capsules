const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: { // recipient
    type: DataTypes.UUID,
    allowNull: false
  },
  actorId: { // who triggered
    type: DataTypes.UUID,
    allowNull: false
  },
  type: { // like, comment, favorite, follow
    type: DataTypes.STRING,
    allowNull: false
  },
  capsuleId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Notification;

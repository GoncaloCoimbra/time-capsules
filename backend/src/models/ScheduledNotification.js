const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const ScheduledNotification = sequelize.define('ScheduledNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  actorId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  capsuleId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  remindAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sent: {
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

module.exports = ScheduledNotification;

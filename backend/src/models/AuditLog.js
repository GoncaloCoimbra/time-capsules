const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceId: {
    type: DataTypes.UUID
  },
  details: {
    type: DataTypes.JSON
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  updatedAt: false
});

module.exports = AuditLog;

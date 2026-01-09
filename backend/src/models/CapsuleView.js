const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const CapsuleView = sequelize.define('CapsuleView', {
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
  timestamps: true
});

module.exports = CapsuleView;

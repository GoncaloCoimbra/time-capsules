const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const CapsuleTag = sequelize.define('CapsuleTag', {
  capsuleId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  tagId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = CapsuleTag;

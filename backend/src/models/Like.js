// backend/models/Like.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
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
    allowNull: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reactionType: {
    type: DataTypes.ENUM(
      'like',     
      'love',      
      'fire',    
      'idea',     
      'laugh',    
      'wow',       
      'celebrate',
      'clap'       
    ),
    allowNull: false,
    defaultValue: 'like'
  }
}, {
  tableName: 'Likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'capsuleId', 'reactionType'],
      name: 'unique_user_capsule_reaction',
      where: {
        capsuleId: { [DataTypes.Op.ne]: null }
      }
    },
    {
      unique: true,
      fields: ['userId', 'commentId', 'reactionType'],
      name: 'unique_user_comment_reaction',
      where: {
        commentId: { [DataTypes.Op.ne]: null }
      }
    }
  ]
});

module.exports = Like;
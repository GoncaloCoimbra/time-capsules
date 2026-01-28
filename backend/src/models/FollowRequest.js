/**
 * Modelo de Pedido de Seguimento
 * 
 * Armazena pedidos pendentes quando um utilizador tem conta privada.
 * Quando aprovado, cria uma relação Follow.
 * Quando rejeitado, remove este registo.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const FollowRequest = sequelize.define('FollowRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['requesterId', 'targetId']
    }
  ]
});

module.exports = FollowRequest;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DirectMessage = sequelize.define(
  'DirectMessage',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    receiver_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
    reply_to_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  {
    tableName: 'direct_messages',
  }
);

module.exports = DirectMessage;

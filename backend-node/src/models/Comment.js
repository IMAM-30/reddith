const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define(
  'Comment',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    post_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: 'comments',
  }
);

module.exports = Comment;

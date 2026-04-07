const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommunityUser = sequelize.define(
  'CommunityUser',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    community_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'community_user',
  }
);

module.exports = CommunityUser;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Community = sequelize.define(
  'Community',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    icon: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'communities',
  }
);

module.exports = Community;

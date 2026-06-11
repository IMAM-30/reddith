const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    nim: { type: DataTypes.STRING, allowNull: false, unique: true },
    email_verified_at: { type: DataTypes.DATE, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, allowNull: true },
    cover: { type: DataTypes.STRING, allowNull: true },
    font_size_level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' },
    remember_token: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'users',
  }
);

module.exports = User;

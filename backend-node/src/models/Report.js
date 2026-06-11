const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define(
  'Report',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    reporter_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    target_type: { type: DataTypes.ENUM('post', 'comment'), allowNull: false },
    target_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    target_owner_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    post_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: false },
    evidence_image: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    moderator_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    moderator_note: { type: DataTypes.TEXT, allowNull: true },
    resolved_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'reports',
  }
);

module.exports = Report;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Notifikasi mengikuti format Laravel notifications table (UUID + polymorphic notifiable + JSON data)
const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    type: { type: DataTypes.STRING, allowNull: false },
    notifiable_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    notifiable_type: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: false }, // JSON string
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'notifications',
  }
);

module.exports = Notification;

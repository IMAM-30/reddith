const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Vote = polymorphic (Opsi A: pertahankan struktur Laravel).
// voteable_type berisi: "App\\Models\\Post" atau "App\\Models\\Comment"
// Karena Sequelize tidak support polymorphic native, relasi ke Post/Comment
// di-handle manual di controller — tidak ada belongsTo otomatis.
const Vote = sequelize.define(
  'Vote',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    voteable_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    voteable_type: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.TINYINT, allowNull: false }, // 1 atau -1
  },
  {
    tableName: 'votes',
    indexes: [
      { unique: true, fields: ['user_id', 'voteable_id', 'voteable_type'] },
    ],
  }
);

// Konstanta tipe untuk konsistensi
Vote.TYPE_POST = 'App\\Models\\Post';
Vote.TYPE_COMMENT = 'App\\Models\\Comment';

module.exports = Vote;

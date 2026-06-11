const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { sequelize } = require('./src/models');

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_DIST = process.env.FRONTEND_DIST
  ? path.resolve(__dirname, process.env.FRONTEND_DIST)
  : path.join(__dirname, 'public');
const SERVE_FRONTEND = fs.existsSync(path.join(FRONTEND_DIST, 'index.html'));

// Middleware global
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / curl / Postman
    if (corsOrigins.includes('*')) return cb(null, true);
    if (corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} tidak diizinkan oleh CORS.`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve file upload (avatars, posts, communities)
app.use('/storage', express.static(path.join(__dirname, 'storage')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api', require('./src/routes/api'));

// Frontend static (production single-origin setup)
if (SERVE_FRONTEND) {
  console.log(`📦 Serving frontend from: ${FRONTEND_DIST}`);
  app.use(express.static(FRONTEND_DIST, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  // SPA fallback — semua route non-API kembalikan index.html
  app.get(/^\/(?!api|storage).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Reddith API (Node.js + Express + Sequelize)', version: '1.0.0' });
  });
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  // multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(422).json({
      message: 'File terlalu besar (maks 2MB).',
    });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Terjadi kesalahan pada server',
  });
});

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected: MySQL (reddith)');

    // Idempotent micro-migration: tambah kolom reply_to_id kalau belum ada
    try {
      const [cols] = await sequelize.query("SHOW COLUMNS FROM direct_messages LIKE 'reply_to_id'");
      if (cols.length === 0) {
        await sequelize.query('ALTER TABLE direct_messages ADD COLUMN reply_to_id BIGINT UNSIGNED NULL');
        console.log('🛠  Migrated: direct_messages.reply_to_id');
      }
    } catch (e) {
      console.warn('⚠️  reply_to_id migration skipped:', e.message);
    }

    // User account compatibility: keep older Hostinger/Laravel-style schemas usable.
    try {
      const ensureUserColumn = async (name, definition) => {
        const [rows] = await sequelize.query(`SHOW COLUMNS FROM users LIKE ${sequelize.escape(name)}`);
        if (rows.length === 0) {
          await sequelize.query(`ALTER TABLE users ADD COLUMN ${definition}`);
          console.log(`🛠  Migrated: users.${name}`);
        }
      };

      await ensureUserColumn('name', 'name VARCHAR(255) NULL AFTER id');
      await ensureUserColumn('nim', 'nim VARCHAR(255) NULL AFTER email');
      await ensureUserColumn('email_verified_at', 'email_verified_at DATETIME NULL AFTER nim');
      await ensureUserColumn('password', 'password VARCHAR(255) NULL AFTER email_verified_at');
      await ensureUserColumn('avatar', 'avatar VARCHAR(255) NULL AFTER password');
      await ensureUserColumn('cover', 'cover VARCHAR(255) NULL AFTER avatar');
      await ensureUserColumn('font_size_level', 'font_size_level TINYINT NOT NULL DEFAULT 0 AFTER cover');
      await ensureUserColumn('role', "role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER font_size_level");
      await ensureUserColumn('remember_token', 'remember_token VARCHAR(100) NULL');
      await ensureUserColumn(
        'updated_at',
        'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      );

      const [userColumns] = await sequelize.query('SHOW COLUMNS FROM users');
      const userColumnNames = userColumns.map((column) => column.Field);

      if (userColumnNames.includes('full_name')) {
        await sequelize.query(
          "UPDATE users SET name = COALESCE(NULLIF(name, ''), NULLIF(full_name, ''), username) WHERE name IS NULL OR name = ''"
        );
      } else {
        await sequelize.query(
          "UPDATE users SET name = COALESCE(NULLIF(name, ''), username) WHERE name IS NULL OR name = ''"
        );
      }
      if (userColumnNames.includes('password_hash')) {
        await sequelize.query(
          "UPDATE users SET password = COALESCE(NULLIF(password, ''), NULLIF(password_hash, '')) WHERE password IS NULL OR password = ''"
        );
      }
      if (userColumnNames.includes('profile_photo')) {
        await sequelize.query(
          "UPDATE users SET avatar = COALESCE(NULLIF(avatar, ''), NULLIF(profile_photo, '')) WHERE avatar IS NULL OR avatar = ''"
        );
      }
      await sequelize.query("UPDATE users SET nim = LPAD(id, 9, '0') WHERE nim IS NULL OR nim = ''");
      await sequelize.query("UPDATE users SET font_size_level = 0 WHERE font_size_level IS NULL");
      await sequelize.query("UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''");

      try {
        await sequelize.query('CREATE UNIQUE INDEX users_nim_unique ON users (nim)');
        console.log('🛠  Migrated: users.nim unique index');
      } catch (e) {
        if (!/Duplicate key name/i.test(e.message)) {
          console.warn('⚠️  users.nim unique index skipped:', e.message);
        }
      }
    } catch (e) {
      console.warn('⚠️  user compatibility migration skipped:', e.message);
    }

    // Moderation reports
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          reporter_id BIGINT UNSIGNED NOT NULL,
          target_type ENUM('post','comment') NOT NULL,
          target_id BIGINT UNSIGNED NOT NULL,
          target_owner_id BIGINT UNSIGNED NULL,
          post_id BIGINT UNSIGNED NULL,
          reason TEXT NOT NULL,
          evidence_image VARCHAR(255) NULL,
          status ENUM('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
          moderator_id BIGINT UNSIGNED NULL,
          moderator_note TEXT NULL,
          resolved_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX reports_status_created_idx (status, created_at),
          INDEX reports_target_idx (target_type, target_id),
          INDEX reports_reporter_idx (reporter_id),
          INDEX reports_post_idx (post_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (e) {
      console.warn('⚠️  reports migration skipped:', e.message);
    }

    // Community: visibility + min_karma
    try {
      const [v] = await sequelize.query("SHOW COLUMNS FROM communities LIKE 'visibility'");
      if (v.length === 0) {
        await sequelize.query("ALTER TABLE communities ADD COLUMN visibility ENUM('public','private') NOT NULL DEFAULT 'public'");
        console.log('🛠  Migrated: communities.visibility');
      }
      const [k] = await sequelize.query("SHOW COLUMNS FROM communities LIKE 'min_karma'");
      if (k.length === 0) {
        await sequelize.query('ALTER TABLE communities ADD COLUMN min_karma INT NOT NULL DEFAULT 0');
        console.log('🛠  Migrated: communities.min_karma');
      }
      const [cover] = await sequelize.query("SHOW COLUMNS FROM communities LIKE 'cover'");
      if (cover.length === 0) {
        await sequelize.query('ALTER TABLE communities ADD COLUMN cover VARCHAR(255) NULL AFTER icon');
        console.log('🛠  Migrated: communities.cover');
      }
      const [s] = await sequelize.query("SHOW COLUMNS FROM community_user LIKE 'status'");
      if (s.length === 0) {
        await sequelize.query("ALTER TABLE community_user ADD COLUMN status ENUM('active','pending') NOT NULL DEFAULT 'active'");
        console.log('🛠  Migrated: community_user.status');
      }
    } catch (e) {
      console.warn('⚠️  community migration skipped:', e.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Gagal connect database:', error.message);
    process.exit(1);
  }
}

start();

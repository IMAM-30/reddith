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

// ── Middleware global ───────────────────────────────────
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

// ── API Routes ──────────────────────────────────────────
app.use('/api', require('./src/routes/api'));

// ── Frontend static (production single-origin setup) ───
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

// ── 404 handler ─────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// ── Error handler global ────────────────────────────────
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

// ── Start server ────────────────────────────────────────
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

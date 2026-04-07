const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./src/models');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware global ───────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve file dari folder Laravel storage (kompatibel dengan data lama)
app.use(
  '/storage',
  express.static(
    path.join(__dirname, '..', 'backend', 'storage', 'app', 'public')
  )
);

// ── Health & root ───────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Reddith API (Node.js + Express + Sequelize)', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ── API Routes ──────────────────────────────────────────
app.use('/api', require('./src/routes/api'));

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

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Gagal connect database:', error.message);
    process.exit(1);
  }
}

start();

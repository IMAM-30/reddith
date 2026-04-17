// Helper untuk bikin URL file (avatar, post image, community icon)
require('dotenv').config();

const APP_URL = process.env.APP_URL || '';

function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Kalau APP_URL di-set → absolute URL (berguna kalau frontend beda origin)
  // Kalau kosong → relative path (bekerja untuk single-origin deploy)
  return APP_URL ? `${APP_URL}/storage/${path}` : `/storage/${path}`;
}

module.exports = { assetUrl, APP_URL };

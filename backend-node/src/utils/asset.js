// Helper untuk bikin URL file (avatar, post image, community icon)
// Match output Laravel: asset('storage/' . $path)
require('dotenv').config();

const APP_URL = process.env.APP_URL || 'http://localhost:5001';

function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${APP_URL}/storage/${path}`;
}

module.exports = { assetUrl, APP_URL };

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Simpan file ke backend-node/storage. URL diakses lewat /storage/...
const STORAGE_ROOT = path.join(__dirname, '..', '..', 'storage');

function createUploader(subfolder) {
  const dest = path.join(STORAGE_ROOT, subfolder);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name =
        Date.now().toString(36) +
        '_' +
        Math.random().toString(36).slice(2, 8) +
        ext;
      cb(null, name);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB (sama dengan Laravel)
    fileFilter: (req, file, cb) => {
      if (!/^image\/(jpeg|png|jpg|webp|gif)$/.test(file.mimetype)) {
        return cb(new Error('File harus berupa gambar.'));
      }
      cb(null, true);
    },
  });
}

// Helper: dapatkan relative path yang akan disimpan di DB (mis: "avatars/abc.jpg")
function relativePathFromFile(file, subfolder) {
  if (!file) return null;
  return `${subfolder}/${file.filename}`;
}

// Helper: hapus file dari storage
function deleteStorageFile(relativePath) {
  if (!relativePath) return;
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (e) {
      // ignore
    }
  }
}

module.exports = {
  createUploader,
  relativePathFromFile,
  deleteStorageFile,
  STORAGE_ROOT,
};

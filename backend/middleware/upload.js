const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]/gi, '-')
      .slice(0, 40);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, WEBP or GIF photos are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per photo
});

/** Deletes a previously uploaded photo file from disk (best-effort, ignores errors). */
function deleteUploadedFile(filename) {
  if (!filename) return;
  fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
}

module.exports = { upload, UPLOAD_DIR, deleteUploadedFile };

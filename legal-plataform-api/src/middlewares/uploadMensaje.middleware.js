const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storageDir = path.join(__dirname, '../../storage/mensajes_archivos');
fs.mkdirSync(storageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path
      .basename(file.originalname || 'archivo', ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);

    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const allowedExt = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.txt',
  '.xlsx',
  '.xls'
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!allowedExt.has(ext)) {
    return cb(new Error('Tipo de archivo no permitido'));
  }

  cb(null, true);
};

const uploadMensaje = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 5
  }
});

module.exports = {
  uploadMensaje
};

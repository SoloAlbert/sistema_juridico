const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storageDir = path.join(__dirname, '../../storage/perfiles_abogados');
fs.mkdirSync(storageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storageDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path
      .basename(file.originalname || 'perfil', ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);

    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!allowedExt.has(ext)) {
    return cb(new Error('Solo se permiten imagenes jpg, jpeg, png o webp'));
  }

  cb(null, true);
};

const uploadPerfilAbogado = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  uploadPerfilAbogado
};

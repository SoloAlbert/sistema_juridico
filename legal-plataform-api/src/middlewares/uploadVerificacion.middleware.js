const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../storage/verificaciones_abogados');
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();

    cb(null, `${timestamp}_${base}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const permitidos = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!permitidos.includes(ext)) {
    return cb(new Error('Solo se permiten archivos PDF o imagen'));
  }

  cb(null, true);
};

const uploadVerificacion = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = {
  uploadVerificacion
};
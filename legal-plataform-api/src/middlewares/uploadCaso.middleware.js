const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../storage/casos_archivos');
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
  const permitidos = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!permitidos.includes(ext)) {
    return cb(new Error('Solo se permiten PDF, imagen o documentos Word'));
  }

  cb(null, true);
};

const uploadCasoArchivos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

module.exports = {
  uploadCasoArchivos
};

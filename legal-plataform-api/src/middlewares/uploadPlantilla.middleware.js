const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../storage/plantillas_base');
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
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== '.docx') {
    return cb(new Error('Solo se permiten archivos .docx'));
  }

  cb(null, true);
};

const uploadPlantillaDocx = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = {
  uploadPlantillaDocx
};
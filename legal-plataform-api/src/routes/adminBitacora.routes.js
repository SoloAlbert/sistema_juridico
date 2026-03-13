const express = require('express');
const router = express.Router();

const { listarBitacoraAdmin } = require('../controllers/adminBitacora.controller');
const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarBitacoraAdmin);

module.exports = router;
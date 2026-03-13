const express = require('express');
const router = express.Router();

const {
  listarPapeleraAdmin,
  enviarAPapeleraAdmin,
  restaurarDePapeleraAdmin
} = require('../controllers/adminPapelera.controller');

const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarPapeleraAdmin);
router.post('/:tipo/:id/enviar', enviarAPapeleraAdmin);
router.post('/:tipo/:id/restaurar', restaurarDePapeleraAdmin);

module.exports = router;
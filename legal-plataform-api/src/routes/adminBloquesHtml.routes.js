const express = require('express');
const router = express.Router();

const {
  listarBloquesHtmlAdmin,
  obtenerBloqueHtmlAdminPorId,
  crearBloqueHtmlAdmin,
  actualizarBloqueHtmlAdmin
} = require('../controllers/adminBloquesHtml.controller');

const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarBloquesHtmlAdmin);
router.get('/:id', obtenerBloqueHtmlAdminPorId);
router.post('/', crearBloqueHtmlAdmin);
router.put('/:id', actualizarBloqueHtmlAdmin);

module.exports = router;
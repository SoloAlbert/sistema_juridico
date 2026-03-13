const express = require('express');
const router = express.Router();

const {
  listarMisConversaciones,
  obtenerMensajesConversacion,
  enviarMensaje
} = require('../controllers/conversaciones.controller');

const { validarJWT } = require('../middlewares/auth.middleware');

router.get('/', validarJWT, listarMisConversaciones);
router.get('/:id/mensajes', validarJWT, obtenerMensajesConversacion);
router.post('/:id/mensajes', validarJWT, enviarMensaje);

module.exports = router;
const express = require('express');
const router = express.Router();

const {
  listarMisConversaciones,
  obtenerMensajesConversacion,
  enviarMensaje
} = require('../controllers/conversaciones.controller');

const { validarJWT } = require('../middlewares/auth.middleware');
const { uploadMensaje } = require('../middlewares/uploadMensaje.middleware');

router.get('/', validarJWT, listarMisConversaciones);
router.get('/:id/mensajes', validarJWT, obtenerMensajesConversacion);
router.post('/:id/mensajes', validarJWT, uploadMensaje.array('archivos', 5), enviarMensaje);

module.exports = router;

const express = require('express');
const router = express.Router();

const {
  listarMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas
} = require('../controllers/notificaciones.controller');

const { validarJWT } = require('../middlewares/auth.middleware');

router.get('/', validarJWT, listarMisNotificaciones);
router.patch('/leer-todas', validarJWT, marcarTodasLeidas);
router.patch('/:id/leer', validarJWT, marcarNotificacionLeida);

module.exports = router;

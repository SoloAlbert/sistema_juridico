const express = require('express');
const router = express.Router();

const {
  crearCita,
  listarMisCitas,
  obtenerDetalleCita,
  actualizarCita,
  actualizarEstadoCita
} = require('../controllers/citas.controller');

const { validarJWT } = require('../middlewares/auth.middleware');

router.post('/', validarJWT, crearCita);
router.get('/mis-citas', validarJWT, listarMisCitas);
router.get('/:id', validarJWT, obtenerDetalleCita);
router.put('/:id', validarJWT, actualizarCita);
router.patch('/:id/estado', validarJWT, actualizarEstadoCita);

module.exports = router;

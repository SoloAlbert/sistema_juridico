const express = require('express');
const router = express.Router();

const {
  crearCita,
  listarMisCitas,
  actualizarEstadoCita
} = require('../controllers/citas.controller');

const { validarJWT } = require('../middlewares/auth.middleware');

router.post('/', validarJWT, crearCita);
router.get('/mis-citas', validarJWT, listarMisCitas);
router.patch('/:id/estado', validarJWT, actualizarEstadoCita);

module.exports = router;
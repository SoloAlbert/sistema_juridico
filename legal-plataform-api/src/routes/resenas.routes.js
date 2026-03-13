const express = require('express');
const router = express.Router();

const {
  obtenerDetalleCasoAsignado,
  completarCaso,
  crearResena,
  listarResenasAbogado,
  responderResena
} = require('../controllers/resenas.controller');

const { validarJWT, soloCliente, soloAbogado } = require('../middlewares/auth.middleware');

router.get('/caso/:id', validarJWT, obtenerDetalleCasoAsignado);
router.patch('/caso/:id/completar', validarJWT, completarCaso);

router.post('/caso/:id', validarJWT, soloCliente, crearResena);
router.get('/abogado/:id_abogado', listarResenasAbogado);
router.patch('/:id/responder', validarJWT, soloAbogado, responderResena);

module.exports = router;
const express = require('express');
const router = express.Router();

const {
  crearCaso,
  listarMisCasosCliente,
  obtenerMiCasoCliente,
  listarCasosDisponiblesAbogado,
  obtenerCasoDisponibleAbogado,
  postularmeACaso,
  asignarAbogadoACaso
} = require('../controllers/casos.controller');

const { validarJWT, soloCliente, soloAbogado } = require('../middlewares/auth.middleware');

/* CLIENTE */
router.post('/', validarJWT, soloCliente, crearCaso);
router.get('/mis-casos', validarJWT, soloCliente, listarMisCasosCliente);
router.get('/mis-casos/:id', validarJWT, soloCliente, obtenerMiCasoCliente);
router.post('/:id/asignar-abogado', validarJWT, soloCliente, asignarAbogadoACaso);

/* ABOGADO */
router.get('/disponibles', validarJWT, soloAbogado, listarCasosDisponiblesAbogado);
router.get('/disponibles/:id', validarJWT, soloAbogado, obtenerCasoDisponibleAbogado);
router.post('/:id/postularme', validarJWT, soloAbogado, postularmeACaso);

module.exports = router;
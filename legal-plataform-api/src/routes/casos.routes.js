const express = require('express');
const router = express.Router();

const {
  crearCaso,
  listarMisCasosCliente,
  obtenerMiCasoCliente,
  listarCasosDisponiblesAbogado,
  obtenerCasoDisponibleAbogado,
  postularmeACaso,
  asignarAbogadoACaso,
  listarMisCasosAbogado,
  obtenerMiCasoAbogado,
  actualizarEstadoCasoAbogado,
  solicitarDocumentosCasoAbogado,
  agregarNotaPrivadaCasoAbogado
} = require('../controllers/casos.controller');

const { validarJWT, soloCliente, soloAbogado } = require('../middlewares/auth.middleware');

/* CLIENTE */
router.post('/', validarJWT, soloCliente, crearCaso);
router.get('/mis-casos', validarJWT, soloCliente, listarMisCasosCliente);
router.get('/mis-casos/:id', validarJWT, soloCliente, obtenerMiCasoCliente);
router.post('/:id/asignar-abogado', validarJWT, soloCliente, asignarAbogadoACaso);

/* ABOGADO */
router.get('/abogado/mis-casos', validarJWT, soloAbogado, listarMisCasosAbogado);
router.get('/abogado/mis-casos/:id', validarJWT, soloAbogado, obtenerMiCasoAbogado);
router.patch('/abogado/mis-casos/:id/estado', validarJWT, soloAbogado, actualizarEstadoCasoAbogado);
router.post('/abogado/mis-casos/:id/solicitar-documentos', validarJWT, soloAbogado, solicitarDocumentosCasoAbogado);
router.post('/abogado/mis-casos/:id/notas-privadas', validarJWT, soloAbogado, agregarNotaPrivadaCasoAbogado);
router.get('/disponibles', validarJWT, soloAbogado, listarCasosDisponiblesAbogado);
router.get('/disponibles/:id', validarJWT, soloAbogado, obtenerCasoDisponibleAbogado);
router.post('/:id/postularme', validarJWT, soloAbogado, postularmeACaso);

module.exports = router;

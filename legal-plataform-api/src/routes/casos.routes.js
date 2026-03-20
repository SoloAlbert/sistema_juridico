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
const {
  obtenerWorkflow,
  guardarContrato,
  firmarContrato,
  crearHito,
  actualizarAvanceHito,
  aprobarHito,
  observarHito,
  crearDisputa,
  crearAlertaCumplimiento
} = require('../controllers/casoWorkflow.controller');

const { validarJWT, soloCliente, soloAbogado } = require('../middlewares/auth.middleware');

/* CLIENTE */
router.post('/', validarJWT, soloCliente, crearCaso);
router.get('/mis-casos', validarJWT, soloCliente, listarMisCasosCliente);
router.get('/mis-casos/:id', validarJWT, soloCliente, obtenerMiCasoCliente);
router.post('/:id/asignar-abogado', validarJWT, soloCliente, asignarAbogadoACaso);
router.get('/:id/workflow', validarJWT, obtenerWorkflow);
router.post('/:id/workflow/contrato', validarJWT, guardarContrato);
router.post('/:id/workflow/firmar', validarJWT, firmarContrato);
router.post('/:id/workflow/hitos', validarJWT, crearHito);
router.patch('/:id/workflow/hitos/:idHito/avance', validarJWT, soloAbogado, actualizarAvanceHito);
router.patch('/:id/workflow/hitos/:idHito/aprobar', validarJWT, soloCliente, aprobarHito);
router.patch('/:id/workflow/hitos/:idHito/observar', validarJWT, soloCliente, observarHito);
router.post('/:id/workflow/disputas', validarJWT, crearDisputa);
router.post('/:id/workflow/alertas-cumplimiento', validarJWT, crearAlertaCumplimiento);

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

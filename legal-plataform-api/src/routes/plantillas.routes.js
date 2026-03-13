const express = require('express');
const router = express.Router();

const {
  listarPlantillas,
  obtenerPlantillaPorId,
  comprarPlantilla,
  generarDocumento,
  listarMisCompras,
  listarMisDocumentos,
  previewDocumento
} = require('../controllers/plantillas.controller');

const { validarJWT, soloAbogado } = require('../middlewares/auth.middleware');

router.get('/', listarPlantillas);
router.get('/mis-compras', validarJWT, soloAbogado, listarMisCompras);
router.get('/mis-documentos', validarJWT, soloAbogado, listarMisDocumentos);
router.get('/:id', obtenerPlantillaPorId);

router.post('/:id/comprar', validarJWT, soloAbogado, comprarPlantilla);
router.post('/:id/preview', validarJWT, soloAbogado, previewDocumento);
router.post('/:id/generar', validarJWT, soloAbogado, generarDocumento);

module.exports = router;
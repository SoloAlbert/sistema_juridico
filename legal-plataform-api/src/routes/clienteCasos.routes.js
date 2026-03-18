const express = require('express');
const router = express.Router();

const {
  crearCasoCliente,
  subirArchivosCasoCliente,
  listarArchivosCasoCliente
} = require('../controllers/clienteCasos.controller');

const { validarJWT, soloCliente } = require('../middlewares/auth.middleware');
const { uploadCasoArchivos } = require('../middlewares/uploadCaso.middleware');

router.use(validarJWT, soloCliente);

router.post('/', crearCasoCliente);
router.get('/:id/archivos', listarArchivosCasoCliente);
router.post('/:id/archivos', uploadCasoArchivos.array('archivos', 10), subirArchivosCasoCliente);

module.exports = router;

const express = require('express');
const router = express.Router();

const {
  listarVerificacionesAdmin,
  obtenerVerificacionAdminPorAbogado,
  revisarDocumentoVerificacionAdmin,
  actualizarValidacionCedulaAdmin
} = require('../controllers/adminVerificaciones.controller');

const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarVerificacionesAdmin);
router.get('/:idAbogado', obtenerVerificacionAdminPorAbogado);
router.post('/:idAbogado/cedula-validacion', actualizarValidacionCedulaAdmin);
router.post('/documentos/:idDocumento/revisar', revisarDocumentoVerificacionAdmin);

module.exports = router;

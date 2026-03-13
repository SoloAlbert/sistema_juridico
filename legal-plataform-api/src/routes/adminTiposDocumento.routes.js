const express = require('express');
const router = express.Router();

const {
  listarTiposDocumentoAdmin,
  obtenerTipoDocumentoAdminPorId,
  crearTipoDocumentoAdmin,
  actualizarTipoDocumentoAdmin,
  obtenerSugerenciaPorTipoAdmin,
  guardarSugerenciaPorTipoAdmin
} = require('../controllers/adminTiposDocumento.controller');

const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarTiposDocumentoAdmin);
router.get('/:id', obtenerTipoDocumentoAdminPorId);
router.post('/', crearTipoDocumentoAdmin);
router.put('/:id', actualizarTipoDocumentoAdmin);
router.get('/:id/sugerencia', obtenerSugerenciaPorTipoAdmin);
router.post('/:id/sugerencia', guardarSugerenciaPorTipoAdmin);

module.exports = router;
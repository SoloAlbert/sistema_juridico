const express = require('express');
const router = express.Router();

const {
  listarTiposDocumentoAdmin,
  obtenerSugerenciaPorTipoAdmin
} = require('../controllers/adminTiposDocumento.controller');

const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarTiposDocumentoAdmin);
router.get('/:id/sugerencia', obtenerSugerenciaPorTipoAdmin);

module.exports = router;
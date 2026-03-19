const express = require('express');
const router = express.Router();

const {
  obtenerMiVerificacion,
  subirDocumentoVerificacion,
  actualizarDatosMiVerificacion
} = require('../controllers/abogadoVerificacion.controller');

const { validarJWT, soloAbogado } = require('../middlewares/auth.middleware');
const { uploadVerificacion } = require('../middlewares/uploadVerificacion.middleware');

router.use(validarJWT, soloAbogado);

router.get('/mi-verificacion', obtenerMiVerificacion);
router.put('/mi-verificacion/datos', actualizarDatosMiVerificacion);
router.post('/mi-verificacion/documentos', uploadVerificacion.single('archivo'), subirDocumentoVerificacion);

module.exports = router;

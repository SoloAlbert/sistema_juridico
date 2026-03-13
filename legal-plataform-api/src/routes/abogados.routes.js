const express = require('express');
const router = express.Router();

const {
  getMiPerfilAbogado,
  actualizarMiPerfilAbogado,
  guardarEspecialidadesAbogado,
  listarAbogadosPublicos,
  obtenerAbogadoPublicoPorId
} = require('../controllers/abogados.controller');

const { validarJWT, soloAbogado } = require('../middlewares/auth.middleware');

router.get('/publicos', listarAbogadosPublicos);
router.get('/publicos/:id', obtenerAbogadoPublicoPorId);

router.get('/mi-perfil', validarJWT, soloAbogado, getMiPerfilAbogado);
router.put('/mi-perfil', validarJWT, soloAbogado, actualizarMiPerfilAbogado);
router.post('/mis-especialidades', validarJWT, soloAbogado, guardarEspecialidadesAbogado);

module.exports = router;
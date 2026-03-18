const express = require('express');
const router = express.Router();

const {
  obtenerDashboardAbogado,
  getMiPerfilAbogado,
  actualizarMiPerfilAbogado,
  subirFotoPerfilAbogado,
  guardarEspecialidadesAbogado,
  listarAbogadosPublicos,
  obtenerAbogadoPublicoPorId
} = require('../controllers/abogados.controller');

const { validarJWT, soloAbogado } = require('../middlewares/auth.middleware');
const { uploadPerfilAbogado } = require('../middlewares/uploadPerfilAbogado.middleware');

router.get('/publicos', listarAbogadosPublicos);
router.get('/publicos/:id', obtenerAbogadoPublicoPorId);

router.get('/dashboard', validarJWT, soloAbogado, obtenerDashboardAbogado);
router.get('/mi-perfil', validarJWT, soloAbogado, getMiPerfilAbogado);
router.put('/mi-perfil', validarJWT, soloAbogado, actualizarMiPerfilAbogado);
router.post('/mi-perfil/foto', validarJWT, soloAbogado, uploadPerfilAbogado.single('foto'), subirFotoPerfilAbogado);
router.post('/mis-especialidades', validarJWT, soloAbogado, guardarEspecialidadesAbogado);

module.exports = router;

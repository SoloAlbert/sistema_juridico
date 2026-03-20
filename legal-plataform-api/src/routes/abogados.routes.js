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
const {
  obtenerEstadoMercadoPagoAbogado,
  generarUrlConexionMercadoPago,
  completarOAuthMercadoPago,
  desconectarMercadoPagoAbogado
} = require('../controllers/abogadoMarketplace.controller');

const { validarJWT, soloAbogado } = require('../middlewares/auth.middleware');
const { uploadPerfilAbogado } = require('../middlewares/uploadPerfilAbogado.middleware');

router.get('/publicos', listarAbogadosPublicos);
router.get('/publicos/:id', obtenerAbogadoPublicoPorId);

router.get('/dashboard', validarJWT, soloAbogado, obtenerDashboardAbogado);
router.get('/mi-perfil', validarJWT, soloAbogado, getMiPerfilAbogado);
router.put('/mi-perfil', validarJWT, soloAbogado, actualizarMiPerfilAbogado);
router.post('/mi-perfil/foto', validarJWT, soloAbogado, uploadPerfilAbogado.single('foto'), subirFotoPerfilAbogado);
router.post('/mis-especialidades', validarJWT, soloAbogado, guardarEspecialidadesAbogado);
router.get('/mercado-pago/oauth/callback', completarOAuthMercadoPago);
router.get('/mi-cuenta-mercadopago', validarJWT, soloAbogado, obtenerEstadoMercadoPagoAbogado);
router.get('/mercado-pago/connect-url', validarJWT, soloAbogado, generarUrlConexionMercadoPago);
router.delete('/mercado-pago/conexion', validarJWT, soloAbogado, desconectarMercadoPagoAbogado);

module.exports = router;

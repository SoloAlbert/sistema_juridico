const express = require('express');
const router = express.Router();

const {
  obtenerResumenPagoCaso,
  registrarPagoCaso,
  webhookMercadoPago,
  listarMisPagosCliente,
  listarMisIngresosAbogado
} = require('../controllers/pagos.controller');

const { validarJWT, soloCliente, soloAbogado } = require('../middlewares/auth.middleware');

router.get('/caso/:id/resumen', validarJWT, obtenerResumenPagoCaso);

router.post('/caso/:id/pagar', validarJWT, soloCliente, registrarPagoCaso);
router.post('/mercadopago/webhook', webhookMercadoPago);
router.get('/mercadopago/webhook', webhookMercadoPago);
router.get('/mis-pagos', validarJWT, soloCliente, listarMisPagosCliente);
router.get('/mis-ingresos', validarJWT, soloAbogado, listarMisIngresosAbogado);

module.exports = router;

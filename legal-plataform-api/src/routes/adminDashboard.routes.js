const express = require('express');
const router = express.Router();

const { obtenerDashboardAdmin } = require('../controllers/adminDashboard.controller');
const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', obtenerDashboardAdmin);

module.exports = router;
const express = require('express');
const router = express.Router();

const {
  listarCumplimientoAdmin,
  resolverAlertaCumplimientoAdmin,
  resolverDisputaAdmin
} = require('../controllers/adminCumplimiento.controller');
const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarCumplimientoAdmin);
router.patch('/alertas/:idAlerta', resolverAlertaCumplimientoAdmin);
router.patch('/disputas/:idDisputa', resolverDisputaAdmin);

module.exports = router;

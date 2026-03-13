const express = require('express');
const router = express.Router();

const {
  listarPlantillasMaestrasAdmin,
  obtenerPlantillaMaestraAdminPorId,
  crearPlantillaMaestraAdmin,
  actualizarPlantillaMaestraAdmin,
  clonarPlantillaMaestraAdmin
} = require('../controllers/adminPlantillasMaestras.controller');

const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');

router.use(validarJWT, soloAdmin);

router.get('/', listarPlantillasMaestrasAdmin);
router.get('/:id', obtenerPlantillaMaestraAdminPorId);
router.post('/', crearPlantillaMaestraAdmin);
router.put('/:id', actualizarPlantillaMaestraAdmin);
router.post('/:id/clonar', clonarPlantillaMaestraAdmin);

module.exports = router;

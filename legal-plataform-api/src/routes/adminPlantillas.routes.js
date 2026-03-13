const express = require('express');
const router = express.Router();

const {
  listarCatalogosPlantillas,
  listarPlantillasAdmin,
  obtenerPlantillaAdminPorId,
  crearPlantillaAdmin,
  actualizarPlantillaAdmin,
  guardarVariablesPlantillaAdmin,
  crearVersionPlantillaAdmin,
  subirArchivoBaseVersionAdmin,
  clonarPlantillaAdmin
} = require('../controllers/adminPlantillas.controller');

const { validarJWT, soloAdmin } = require('../middlewares/auth.middleware');
const { uploadPlantillaDocx } = require('../middlewares/uploadPlantilla.middleware');

router.use(validarJWT, soloAdmin);

router.get('/catalogos', listarCatalogosPlantillas);
router.get('/', listarPlantillasAdmin);
router.get('/:id', obtenerPlantillaAdminPorId);
router.post('/', crearPlantillaAdmin);
router.put('/:id', actualizarPlantillaAdmin);
router.post('/:id/clonar', clonarPlantillaAdmin);
router.post('/:id/variables', guardarVariablesPlantillaAdmin);
router.post('/:id/versiones', crearVersionPlantillaAdmin);

router.post(
  '/:id/versiones/:idVersion/upload-docx',
  uploadPlantillaDocx.single('archivo'),
  subirArchivoBaseVersionAdmin
);

module.exports = router;

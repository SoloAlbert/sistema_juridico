const express = require('express');
const router = express.Router();
const { getEspecialidades } = require('../controllers/especialidades.controller');

router.get('/', getEspecialidades);

module.exports = router;
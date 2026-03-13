const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');

router.get('/ping', (req, res) => {
  res.json({
    ok: true,
    message: 'Auth routes funcionando'
  });
});

router.post('/register', register);
router.post('/login', login);

module.exports = router;
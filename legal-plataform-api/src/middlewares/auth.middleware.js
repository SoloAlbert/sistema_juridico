const jwt = require('jsonwebtoken');
require('dotenv').config();

const validarJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado'
    });
  }
};

const soloAbogado = (req, res, next) => {
  if (req.user.role !== 'abogado') {
    return res.status(403).json({
      ok: false,
      message: 'Acceso solo para abogados'
    });
  }
  next();
};

const soloCliente = (req, res, next) => {
  if (req.user.role !== 'cliente') {
    return res.status(403).json({
      ok: false,
      message: 'Acceso solo para clientes'
    });
  }
  next();
};

const soloAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      ok: false,
      message: 'Acceso solo para administradores'
    });
  }
  next();
};

module.exports = {
  validarJWT,
  soloAbogado,
  soloCliente,
  soloAdmin
};
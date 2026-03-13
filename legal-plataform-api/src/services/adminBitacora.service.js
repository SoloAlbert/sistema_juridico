const { pool } = require('../config/db');

const registrarBitacoraAdmin = async ({
  id_usuario,
  modulo,
  entidad,
  id_entidad = null,
  accion,
  descripcion = null,
  datos_antes = null,
  datos_despues = null,
  req = null,
  connection = null
}) => {
  try {
    if (!id_usuario || !modulo || !entidad || !accion) return;

    const executor = connection || pool;

    const ip =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      null;

    const userAgent = req?.headers?.['user-agent'] || null;

    await executor.query(
      `INSERT INTO admin_bitacora
      (
        id_usuario,
        modulo,
        entidad,
        id_entidad,
        accion,
        descripcion,
        datos_antes_json,
        datos_despues_json,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_usuario,
        modulo,
        entidad,
        id_entidad,
        accion,
        descripcion,
        datos_antes ? JSON.stringify(datos_antes) : null,
        datos_despues ? JSON.stringify(datos_despues) : null,
        ip,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Error registrando bitácora admin:', error);
  }
};

module.exports = {
  registrarBitacoraAdmin
};
const { pool } = require('../config/db');

const crearNotificacion = async ({
  id_usuario,
  tipo_notificacion = 'sistema',
  titulo,
  mensaje,
  connection = pool
}) => {
  if (!id_usuario || !titulo || !mensaje) {
    return null;
  }

  const [result] = await connection.query(
    `INSERT INTO notificaciones
    (id_usuario, tipo_notificacion, titulo, mensaje, leida)
    VALUES (?, ?, ?, ?, 0)`,
    [id_usuario, tipo_notificacion, titulo, mensaje]
  );

  return result.insertId;
};

const crearNotificacionesMasivas = async ({
  usuarios = [],
  tipo_notificacion = 'sistema',
  titulo,
  mensaje,
  connection = pool
}) => {
  const ids = [...new Set((usuarios || []).filter(Boolean).map((item) => Number(item)))].filter(Boolean);

  if (ids.length === 0 || !titulo || !mensaje) {
    return 0;
  }

  const values = ids.map((id_usuario) => [id_usuario, tipo_notificacion, titulo, mensaje, 0]);

  await connection.query(
    `INSERT INTO notificaciones
    (id_usuario, tipo_notificacion, titulo, mensaje, leida)
    VALUES ?`,
    [values]
  );

  return ids.length;
};

module.exports = {
  crearNotificacion,
  crearNotificacionesMasivas
};

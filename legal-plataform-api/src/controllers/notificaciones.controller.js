const { pool } = require('../config/db');

const listarMisNotificaciones = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [rows] = await pool.query(
      `SELECT
        id_notificacion,
        tipo_notificacion,
        titulo,
        mensaje,
        leida,
        fecha_lectura,
        created_at
      FROM notificaciones
      WHERE id_usuario = ?
      ORDER BY id_notificacion DESC
      LIMIT 100`,
      [id_usuario]
    );

    const [resumenRows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN leida = 0 THEN 1 ELSE 0 END) AS no_leidas,
        SUM(CASE WHEN tipo_notificacion = 'cita' AND leida = 0 THEN 1 ELSE 0 END) AS citas,
        SUM(CASE WHEN tipo_notificacion = 'mensaje' AND leida = 0 THEN 1 ELSE 0 END) AS mensajes,
        SUM(CASE WHEN tipo_notificacion = 'pago' AND leida = 0 THEN 1 ELSE 0 END) AS pagos,
        SUM(CASE WHEN tipo_notificacion = 'caso' AND leida = 0 THEN 1 ELSE 0 END) AS casos
      FROM notificaciones
      WHERE id_usuario = ?`,
      [id_usuario]
    );

    return res.json({
      ok: true,
      resumen: resumenRows[0] || {},
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisNotificaciones:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener notificaciones'
    });
  }
};

const marcarNotificacionLeida = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE notificaciones
       SET leida = 1,
           fecha_lectura = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id_notificacion = ?
         AND id_usuario = ?`,
      [id, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Notificacion no encontrada'
      });
    }

    return res.json({
      ok: true,
      message: 'Notificacion marcada como leida'
    });
  } catch (error) {
    console.error('Error en marcarNotificacionLeida:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar notificacion'
    });
  }
};

const marcarTodasLeidas = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    await pool.query(
      `UPDATE notificaciones
       SET leida = 1,
           fecha_lectura = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id_usuario = ?
         AND leida = 0`,
      [id_usuario]
    );

    return res.json({
      ok: true,
      message: 'Notificaciones marcadas como leidas'
    });
  } catch (error) {
    console.error('Error en marcarTodasLeidas:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar notificaciones'
    });
  }
};

module.exports = {
  listarMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas
};

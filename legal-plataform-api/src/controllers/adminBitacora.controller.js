const { pool } = require('../config/db');

const listarBitacoraAdmin = async (req, res) => {
  try {
    const { modulo, entidad, accion, limit = 100 } = req.query;

    let sql = `
      SELECT
        b.id_bitacora,
        b.id_usuario,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        b.modulo,
        b.entidad,
        b.id_entidad,
        b.accion,
        b.descripcion,
        b.datos_antes_json,
        b.datos_despues_json,
        b.ip_address,
        b.created_at
      FROM admin_bitacora b
      INNER JOIN usuarios u ON u.id_usuario = b.id_usuario
      WHERE 1 = 1
    `;

    const params = [];

    if (modulo) {
      sql += ` AND b.modulo = ?`;
      params.push(modulo);
    }

    if (entidad) {
      sql += ` AND b.entidad = ?`;
      params.push(entidad);
    }

    if (accion) {
      sql += ` AND b.accion = ?`;
      params.push(accion);
    }

    sql += ` ORDER BY b.id_bitacora DESC LIMIT ?`;
    params.push(Number(limit));

    const [rows] = await pool.query(sql, params);

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarBitacoraAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener bitácora'
    });
  }
};

module.exports = {
  listarBitacoraAdmin
};
const { pool } = require('../config/db');

const getEspecialidades = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_especialidad, nombre, slug, descripcion, icono
       FROM especialidades
       WHERE activo = 1
       ORDER BY orden ASC, nombre ASC`
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en getEspecialidades:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener especialidades'
    });
  }
};

module.exports = {
  getEspecialidades
};
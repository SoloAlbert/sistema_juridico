const { pool } = require('../config/db');

const listarTiposDocumentoAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id_tipo_documento,
        nombre,
        slug,
        descripcion,
        activo
      FROM tipos_documento
      ORDER BY nombre ASC`
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarTiposDocumentoAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar tipos de documento'
    });
  }
};

const obtenerSugerenciaPorTipoAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [tipos] = await pool.query(
      `SELECT
        id_tipo_documento,
        nombre,
        slug,
        descripcion
      FROM tipos_documento
      WHERE id_tipo_documento = ?
      LIMIT 1`,
      [id]
    );

    if (tipos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Tipo de documento no encontrado'
      });
    }

    const tipo = tipos[0];

    const [sugerencias] = await pool.query(
      `SELECT
        s.id_sugerencia,
        s.id_tipo_documento,
        s.id_plantilla_maestra,
        s.variables_sugeridas_json,
        s.bloques_sugeridos_json,
        s.notas_sugeridas,
        s.activo,
        pm.nombre AS plantilla_maestra_nombre
      FROM tipos_documento_sugerencias s
      LEFT JOIN plantilla_maestra_html pm
        ON pm.id_plantilla_maestra = s.id_plantilla_maestra
      WHERE s.id_tipo_documento = ?
        AND s.activo = 1
      ORDER BY s.id_sugerencia DESC
      LIMIT 1`,
      [id]
    );

    return res.json({
      ok: true,
      data: {
        tipo,
        sugerencia: sugerencias[0] || null
      }
    });
  } catch (error) {
    console.error('Error en obtenerSugerenciaPorTipoAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener sugerencias del tipo de documento'
    });
  }
};

module.exports = {
  listarTiposDocumentoAdmin,
  obtenerSugerenciaPorTipoAdmin
};
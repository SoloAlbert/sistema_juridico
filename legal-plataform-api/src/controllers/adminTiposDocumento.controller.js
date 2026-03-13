const { pool } = require('../config/db');

const listarTiposDocumentoAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        td.id_tipo_documento,
        td.nombre,
        td.slug,
        td.descripcion,
        td.activo,
        s.id_sugerencia,
        s.id_plantilla_maestra,
        s.activo AS sugerencia_activa
      FROM tipos_documento td
      LEFT JOIN tipos_documento_sugerencias s
        ON s.id_tipo_documento = td.id_tipo_documento
      ORDER BY td.nombre ASC`
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
        descripcion,
        activo
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
      LIMIT 1`,
      [id]
    );

    const [plantillasMaestras] = await pool.query(
      `SELECT
        id_plantilla_maestra,
        nombre,
        slug,
        activo
      FROM plantilla_maestra_html
      WHERE activo = 1
      ORDER BY nombre ASC`
    );

    return res.json({
      ok: true,
      data: {
        tipo,
        sugerencia: sugerencias[0] || null,
        plantillas_maestras: plantillasMaestras
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

const guardarSugerenciaPorTipoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_plantilla_maestra,
      variables_sugeridas_json,
      bloques_sugeridos_json,
      notas_sugeridas,
      activo
    } = req.body;

    const [tipos] = await pool.query(
      `SELECT id_tipo_documento
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

    const [existente] = await pool.query(
      `SELECT id_sugerencia
       FROM tipos_documento_sugerencias
       WHERE id_tipo_documento = ?
       LIMIT 1`,
      [id]
    );

    if (existente.length > 0) {
      await pool.query(
        `UPDATE tipos_documento_sugerencias
         SET
           id_plantilla_maestra = ?,
           variables_sugeridas_json = ?,
           bloques_sugeridos_json = ?,
           notas_sugeridas = ?,
           activo = ?,
           updated_at = CURRENT_TIMESTAMP
         WHERE id_tipo_documento = ?`,
        [
          id_plantilla_maestra || null,
          JSON.stringify(variables_sugeridas_json || []),
          JSON.stringify(bloques_sugeridos_json || []),
          notas_sugeridas || null,
          activo ? 1 : 0,
          id
        ]
      );

      return res.json({
        ok: true,
        message: 'Sugerencia actualizada correctamente'
      });
    }

    await pool.query(
      `INSERT INTO tipos_documento_sugerencias
      (
        id_tipo_documento,
        id_plantilla_maestra,
        variables_sugeridas_json,
        bloques_sugeridos_json,
        notas_sugeridas,
        activo
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        id_plantilla_maestra || null,
        JSON.stringify(variables_sugeridas_json || []),
        JSON.stringify(bloques_sugeridos_json || []),
        notas_sugeridas || null,
        activo ? 1 : 0
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Sugerencia creada correctamente'
    });
  } catch (error) {
    console.error('Error en guardarSugerenciaPorTipoAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al guardar sugerencia'
    });
  }
};

module.exports = {
  listarTiposDocumentoAdmin,
  obtenerSugerenciaPorTipoAdmin,
  guardarSugerenciaPorTipoAdmin
};
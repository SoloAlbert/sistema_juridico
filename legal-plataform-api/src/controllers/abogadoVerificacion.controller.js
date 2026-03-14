const { pool } = require('../config/db');
const { asegurarRegistroVerificacion, recalcularEstadoVerificacion } = require('../services/abogadoVerificacion.service');

const obtenerMiVerificacion = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [abogados] = await pool.query(
      `SELECT id_abogado
       FROM abogados
       WHERE id_usuario = ?
       LIMIT 1`,
      [id_usuario]
    );

    if (abogados.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const id_abogado = abogados[0].id_abogado;

    const verificacion = await asegurarRegistroVerificacion(id_abogado);

    const [documentos] = await pool.query(
      `SELECT
        id_documento_verificacion,
        tipo_documento,
        nombre_original,
        nombre_archivo,
        ruta_archivo,
        mime_type,
        tamano_bytes,
        estatus_revision,
        observaciones_revision,
        reviewed_by,
        reviewed_at,
        created_at
      FROM abogado_documentos_verificacion
      WHERE id_abogado = ?
        AND deleted_at IS NULL
      ORDER BY id_documento_verificacion DESC`,
      [id_abogado]
    );

    return res.json({
      ok: true,
      data: {
        verificacion,
        documentos
      }
    });
  } catch (error) {
    console.error('Error en obtenerMiVerificacion:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener verificación'
    });
  }
};

const subirDocumentoVerificacion = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { tipo_documento } = req.body;

    if (!tipo_documento) {
      return res.status(400).json({
        ok: false,
        message: 'tipo_documento es obligatorio'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: 'Debes subir un archivo'
      });
    }

    const [abogados] = await pool.query(
      `SELECT id_abogado
       FROM abogados
       WHERE id_usuario = ?
       LIMIT 1`,
      [id_usuario]
    );

    if (abogados.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const id_abogado = abogados[0].id_abogado;

    await asegurarRegistroVerificacion(id_abogado);

    const rutaRelativa = `/verificaciones_abogados/${req.file.filename}`;

    const [result] = await pool.query(
      `INSERT INTO abogado_documentos_verificacion
      (
        id_abogado,
        tipo_documento,
        nombre_original,
        nombre_archivo,
        ruta_archivo,
        mime_type,
        tamano_bytes,
        estatus_revision
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        id_abogado,
        tipo_documento,
        req.file.originalname,
        req.file.filename,
        rutaRelativa,
        req.file.mimetype || null,
        req.file.size || null
      ]
    );

    const resumen = await recalcularEstadoVerificacion(id_abogado);

    return res.status(201).json({
      ok: true,
      message: 'Documento subido correctamente',
      data: {
        id_documento_verificacion: result.insertId,
        verificacion: resumen
      }
    });
  } catch (error) {
    console.error('Error en subirDocumentoVerificacion:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al subir documento'
    });
  }
};

module.exports = {
  obtenerMiVerificacion,
  subirDocumentoVerificacion
};
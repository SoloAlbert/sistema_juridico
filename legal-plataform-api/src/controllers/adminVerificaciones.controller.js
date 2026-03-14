const { pool } = require('../config/db');
const { recalcularEstadoVerificacion } = require('../services/abogadoVerificacion.service');
const { registrarBitacoraAdmin } = require('../services/adminBitacora.service');

const listarVerificacionesAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        av.id_verificacion,
        av.id_abogado,
        av.estatus_identidad,
        av.estatus_cedula,
        av.estatus_general,
        av.badge_verificado,
        av.porcentaje_completado,
        av.observaciones_generales,
        av.reviewed_at,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email
      FROM abogado_verificaciones av
      INNER JOIN abogados a ON a.id_abogado = av.id_abogado
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      ORDER BY av.updated_at DESC`
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarVerificacionesAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar verificaciones'
    });
  }
};

const obtenerVerificacionAdminPorAbogado = async (req, res) => {
  try {
    const { idAbogado } = req.params;

    const [verificaciones] = await pool.query(
      `SELECT
        av.*,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email
      FROM abogado_verificaciones av
      INNER JOIN abogados a ON a.id_abogado = av.id_abogado
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      WHERE av.id_abogado = ?
      LIMIT 1`,
      [idAbogado]
    );

    const [documentos] = await pool.query(
      `SELECT
        id_documento_verificacion,
        id_abogado,
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
      [idAbogado]
    );

    return res.json({
      ok: true,
      data: {
        verificacion: verificaciones[0] || null,
        documentos
      }
    });
  } catch (error) {
    console.error('Error en obtenerVerificacionAdminPorAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener detalle de verificación'
    });
  }
};

const revisarDocumentoVerificacionAdmin = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { idDocumento } = req.params;
    const { estatus_revision, observaciones_revision } = req.body;

    const permitidos = ['aprobado', 'rechazado', 'observado'];
    if (!permitidos.includes(estatus_revision)) {
      return res.status(400).json({
        ok: false,
        message: 'estatus_revision inválido'
      });
    }

    const [antesRows] = await pool.query(
      `SELECT *
       FROM abogado_documentos_verificacion
       WHERE id_documento_verificacion = ?
       LIMIT 1`,
      [idDocumento]
    );

    if (antesRows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Documento no encontrado'
      });
    }

    const antes = antesRows[0];

    await pool.query(
      `UPDATE abogado_documentos_verificacion
       SET
         estatus_revision = ?,
         observaciones_revision = ?,
         reviewed_by = ?,
         reviewed_at = NOW(),
         updated_at = CURRENT_TIMESTAMP
       WHERE id_documento_verificacion = ?`,
      [
        estatus_revision,
        observaciones_revision || null,
        id_usuario,
        idDocumento
      ]
    );

    const resumen = await recalcularEstadoVerificacion(antes.id_abogado);

    await pool.query(
      `UPDATE abogado_verificaciones
       SET
         revisado_por = ?,
         reviewed_at = NOW()
       WHERE id_abogado = ?`,
      [id_usuario, antes.id_abogado]
    );

    await registrarBitacoraAdmin({
      id_usuario,
      modulo: 'verificaciones_abogados',
      entidad: 'abogado_documentos_verificacion',
      id_entidad: idDocumento,
      accion: 'revisar_documento',
      descripcion: `Revisó un documento de verificación del abogado ${antes.id_abogado}`,
      datos_antes: antes,
      datos_despues: {
        estatus_revision,
        observaciones_revision: observaciones_revision || null,
        resumen
      },
      req
    });

    return res.json({
      ok: true,
      message: 'Documento revisado correctamente',
      data: {
        verificacion: resumen
      }
    });
  } catch (error) {
    console.error('Error en revisarDocumentoVerificacionAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al revisar documento'
    });
  }
};

module.exports = {
  listarVerificacionesAdmin,
  obtenerVerificacionAdminPorAbogado,
  revisarDocumentoVerificacionAdmin
};
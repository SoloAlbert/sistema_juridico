const { pool } = require('../config/db');
const { registrarBitacoraAdmin } = require('../services/adminBitacora.service');

const tablasPermitidas = {
  plantillas: {
    tabla: 'plantillas_legales',
    pk: 'id_plantilla',
    modulo: 'plantillas',
    entidad: 'plantillas_legales'
  },
  bloques: {
    tabla: 'plantilla_bloques_html',
    pk: 'id_bloque',
    modulo: 'bloques_html',
    entidad: 'plantilla_bloques_html'
  },
  maestras: {
    tabla: 'plantilla_maestra_html',
    pk: 'id_plantilla_maestra',
    modulo: 'plantillas_maestras',
    entidad: 'plantilla_maestra_html'
  },
  tipos_documento: {
    tabla: 'tipos_documento',
    pk: 'id_tipo_documento',
    modulo: 'tipos_documento',
    entidad: 'tipos_documento'
  }
};

const listarPapeleraAdmin = async (req, res) => {
  try {
    const { tipo } = req.query;

    if (!tipo || !tablasPermitidas[tipo]) {
      return res.status(400).json({
        ok: false,
        message: 'Debes indicar un tipo válido: plantillas, bloques, maestras, tipos_documento'
      });
    }

    const cfg = tablasPermitidas[tipo];

    const [rows] = await pool.query(
      `
      SELECT t.*, u.nombre, u.apellido_paterno, u.apellido_materno, u.email
      FROM ${cfg.tabla} t
      LEFT JOIN usuarios u ON u.id_usuario = t.deleted_by
      WHERE t.deleted_at IS NOT NULL
      ORDER BY t.deleted_at DESC
      `
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarPapeleraAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener papelera'
    });
  }
};

const enviarAPapeleraAdmin = async (req, res) => {
  try {
    const { tipo, id } = req.params;

    if (!tablasPermitidas[tipo]) {
      return res.status(400).json({
        ok: false,
        message: 'Tipo inválido'
      });
    }

    const cfg = tablasPermitidas[tipo];

    const [antesRows] = await pool.query(
      `SELECT * FROM ${cfg.tabla} WHERE ${cfg.pk} = ? LIMIT 1`,
      [id]
    );

    if (antesRows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Registro no encontrado'
      });
    }

    const antes = antesRows[0];

    if (antes.deleted_at) {
      return res.status(409).json({
        ok: false,
        message: 'El registro ya está en papelera'
      });
    }

    await pool.query(
      `
      UPDATE ${cfg.tabla}
      SET deleted_at = NOW(),
          deleted_by = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE ${cfg.pk} = ?
      `,
      [req.user.id_usuario, id]
    );

    await registrarBitacoraAdmin({
      id_usuario: req.user.id_usuario,
      modulo: cfg.modulo,
      entidad: cfg.entidad,
      id_entidad: id,
      accion: 'enviar_papelera',
      descripcion: `Envió a papelera un registro de ${cfg.entidad}`,
      datos_antes: antes,
      datos_despues: {
        deleted_at: new Date().toISOString(),
        deleted_by: req.user.id_usuario
      },
      req
    });

    return res.json({
      ok: true,
      message: 'Registro enviado a papelera'
    });
  } catch (error) {
    console.error('Error en enviarAPapeleraAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al enviar a papelera'
    });
  }
};

const restaurarDePapeleraAdmin = async (req, res) => {
  try {
    const { tipo, id } = req.params;

    if (!tablasPermitidas[tipo]) {
      return res.status(400).json({
        ok: false,
        message: 'Tipo inválido'
      });
    }

    const cfg = tablasPermitidas[tipo];

    const [antesRows] = await pool.query(
      `SELECT * FROM ${cfg.tabla} WHERE ${cfg.pk} = ? LIMIT 1`,
      [id]
    );

    if (antesRows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Registro no encontrado'
      });
    }

    const antes = antesRows[0];

    if (!antes.deleted_at) {
      return res.status(409).json({
        ok: false,
        message: 'El registro no está en papelera'
      });
    }

    await pool.query(
      `
      UPDATE ${cfg.tabla}
      SET deleted_at = NULL,
          deleted_by = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE ${cfg.pk} = ?
      `,
      [id]
    );

    await registrarBitacoraAdmin({
      id_usuario: req.user.id_usuario,
      modulo: cfg.modulo,
      entidad: cfg.entidad,
      id_entidad: id,
      accion: 'restaurar',
      descripcion: `Restauró un registro de ${cfg.entidad}`,
      datos_antes: antes,
      datos_despues: {
        deleted_at: null,
        deleted_by: null
      },
      req
    });

    return res.json({
      ok: true,
      message: 'Registro restaurado correctamente'
    });
  } catch (error) {
    console.error('Error en restaurarDePapeleraAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al restaurar registro'
    });
  }
};

module.exports = {
  listarPapeleraAdmin,
  enviarAPapeleraAdmin,
  restaurarDePapeleraAdmin
};
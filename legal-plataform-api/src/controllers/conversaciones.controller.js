const { pool } = require('../config/db');

const obtenerContextoUsuario = async (id_usuario, role) => {
  if (role === 'cliente') {
    const [rows] = await pool.query(
      'SELECT id_cliente AS id_relacionado FROM clientes WHERE id_usuario = ? LIMIT 1',
      [id_usuario]
    );
    return rows.length ? rows[0].id_relacionado : null;
  }

  if (role === 'abogado') {
    const [rows] = await pool.query(
      'SELECT id_abogado AS id_relacionado FROM abogados WHERE id_usuario = ? LIMIT 1',
      [id_usuario]
    );
    return rows.length ? rows[0].id_relacionado : null;
  }

  return null;
};

const listarMisConversaciones = async (req, res) => {
  try {
    const { id_usuario, role } = req.user;
    const id_relacionado = await obtenerContextoUsuario(id_usuario, role);

    if (!id_relacionado) {
      return res.status(404).json({
        ok: false,
        message: 'Perfil relacionado no encontrado'
      });
    }

    let sql = `
      SELECT
        conv.id_conversacion,
        conv.id_caso,
        conv.id_cliente,
        conv.id_abogado,
        conv.estado,
        conv.created_at,
        c.folio_caso,
        c.titulo,
        c.estado AS estado_caso,
        uc.nombre AS cliente_nombre,
        uc.apellido_paterno AS cliente_apellido_paterno,
        uc.apellido_materno AS cliente_apellido_materno,
        ua.nombre AS abogado_nombre,
        ua.apellido_paterno AS abogado_apellido_paterno,
        ua.apellido_materno AS abogado_apellido_materno,
        (
          SELECT m.mensaje
          FROM mensajes m
          WHERE m.id_conversacion = conv.id_conversacion
          ORDER BY m.id_mensaje DESC
          LIMIT 1
        ) AS ultimo_mensaje,
        (
          SELECT m.created_at
          FROM mensajes m
          WHERE m.id_conversacion = conv.id_conversacion
          ORDER BY m.id_mensaje DESC
          LIMIT 1
        ) AS fecha_ultimo_mensaje
      FROM conversaciones conv
      INNER JOIN casos c ON c.id_caso = conv.id_caso
      INNER JOIN clientes cl ON cl.id_cliente = conv.id_cliente
      INNER JOIN abogados ab ON ab.id_abogado = conv.id_abogado
      INNER JOIN usuarios uc ON uc.id_usuario = cl.id_usuario
      INNER JOIN usuarios ua ON ua.id_usuario = ab.id_usuario
      WHERE
    `;

    const params = [];

    if (role === 'cliente') {
      sql += ' conv.id_cliente = ? ';
      params.push(id_relacionado);
    } else if (role === 'abogado') {
      sql += ' conv.id_abogado = ? ';
      params.push(id_relacionado);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    sql += ' ORDER BY COALESCE(fecha_ultimo_mensaje, conv.created_at) DESC';

    const [rows] = await pool.query(sql, params);

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisConversaciones:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener conversaciones'
    });
  }
};

const obtenerMensajesConversacion = async (req, res) => {
  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;
    const id_relacionado = await obtenerContextoUsuario(id_usuario, role);

    if (!id_relacionado) {
      return res.status(404).json({
        ok: false,
        message: 'Perfil relacionado no encontrado'
      });
    }

    let sqlConv = `
      SELECT
        conv.id_conversacion,
        conv.id_caso,
        conv.id_cliente,
        conv.id_abogado,
        conv.estado,
        c.folio_caso,
        c.titulo
      FROM conversaciones conv
      INNER JOIN casos c ON c.id_caso = conv.id_caso
      WHERE conv.id_conversacion = ?
    `;

    const paramsConv = [id];

    if (role === 'cliente') {
      sqlConv += ' AND conv.id_cliente = ?';
      paramsConv.push(id_relacionado);
    } else if (role === 'abogado') {
      sqlConv += ' AND conv.id_abogado = ?';
      paramsConv.push(id_relacionado);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [conversaciones] = await pool.query(sqlConv, paramsConv);

    if (conversaciones.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Conversación no encontrada'
      });
    }

    const [mensajesRows] = await pool.query(
      `SELECT
        m.id_mensaje,
        m.id_conversacion,
        m.id_remitente,
        m.tipo_mensaje,
        m.mensaje,
        m.leido,
        m.fecha_lectura,
        m.created_at,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno
      FROM mensajes m
      INNER JOIN usuarios u ON u.id_usuario = m.id_remitente
      WHERE m.id_conversacion = ?
      ORDER BY m.id_mensaje ASC`,
      [id]
    );

    const [archivosRows] = await pool.query(
      `SELECT
        ma.id_mensaje_archivo,
        ma.id_mensaje,
        ma.nombre_archivo,
        ma.ruta_archivo,
        ma.mime_type,
        ma.tamano_bytes
      FROM mensaje_archivos ma
      INNER JOIN mensajes m ON m.id_mensaje = ma.id_mensaje
      WHERE m.id_conversacion = ?
      ORDER BY ma.id_mensaje_archivo ASC`,
      [id]
    );

    const archivosPorMensaje = archivosRows.reduce((acc, item) => {
      if (!acc[item.id_mensaje]) {
        acc[item.id_mensaje] = [];
      }

      acc[item.id_mensaje].push(item);
      return acc;
    }, {});

    const mensajes = mensajesRows.map((item) => ({
      ...item,
      archivos: archivosPorMensaje[item.id_mensaje] || []
    }));

    await pool.query(
      `UPDATE mensajes
       SET leido = 1,
           fecha_lectura = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id_conversacion = ?
         AND id_remitente <> ?
         AND leido = 0`,
      [id, id_usuario]
    );

    return res.json({
      ok: true,
      conversacion: conversaciones[0],
      mensajes
    });
  } catch (error) {
    console.error('Error en obtenerMensajesConversacion:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener mensajes'
    });
  }
};

const enviarMensaje = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;
    const { mensaje } = req.body;
    const archivos = Array.isArray(req.files) ? req.files : [];

    if ((!mensaje || !mensaje.trim()) && archivos.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Debes enviar un mensaje o al menos un archivo'
      });
    }

    const id_relacionado = await obtenerContextoUsuario(id_usuario, role);

    if (!id_relacionado) {
      return res.status(404).json({
        ok: false,
        message: 'Perfil relacionado no encontrado'
      });
    }

    let sqlConv = 'SELECT id_conversacion FROM conversaciones WHERE id_conversacion = ?';
    const paramsConv = [id];

    if (role === 'cliente') {
      sqlConv += ' AND id_cliente = ?';
      paramsConv.push(id_relacionado);
    } else if (role === 'abogado') {
      sqlConv += ' AND id_abogado = ?';
      paramsConv.push(id_relacionado);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [conv] = await connection.query(sqlConv, paramsConv);

    if (conv.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Conversación no encontrada'
      });
    }

    await connection.beginTransaction();

    const tipoMensaje = archivos.length > 0 ? 'archivo' : 'texto';

    const [result] = await connection.query(
      `INSERT INTO mensajes
      (id_conversacion, id_remitente, tipo_mensaje, mensaje, leido)
      VALUES (?, ?, ?, ?, 0)`,
      [id, id_usuario, tipoMensaje, mensaje?.trim() || null]
    );

    for (const archivo of archivos) {
      await connection.query(
        `INSERT INTO mensaje_archivos
        (id_mensaje, nombre_archivo, ruta_archivo, mime_type, tamano_bytes)
        VALUES (?, ?, ?, ?, ?)`,
        [
          result.insertId,
          archivo.originalname,
          `/mensajes_archivos/${archivo.filename}`,
          archivo.mimetype || null,
          archivo.size || null
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      ok: true,
      message: 'Mensaje enviado correctamente',
      data: {
        id_mensaje: result.insertId,
        total_archivos: archivos.length
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en enviarMensaje:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al enviar mensaje'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  listarMisConversaciones,
  obtenerMensajesConversacion,
  enviarMensaje
};

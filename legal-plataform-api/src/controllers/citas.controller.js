const { pool } = require('../config/db');
const { crearNotificacion } = require('../services/notificaciones.service');

const obtenerRelacionUsuario = async (id_usuario, role) => {
  if (role === 'cliente') {
    const [rows] = await pool.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
      [id_usuario]
    );
    return rows.length ? { tipo: 'cliente', id: rows[0].id_cliente } : null;
  }

  if (role === 'abogado') {
    const [rows] = await pool.query(
      'SELECT id_abogado FROM abogados WHERE id_usuario = ? LIMIT 1',
      [id_usuario]
    );
    return rows.length ? { tipo: 'abogado', id: rows[0].id_abogado } : null;
  }

  return null;
};

const crearCita = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario, role } = req.user;
    const {
      id_caso,
      titulo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      modalidad,
      ubicacion,
      link_reunion
    } = req.body;

    if (!id_caso || !titulo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        ok: false,
        message: 'id_caso, titulo, fecha_inicio y fecha_fin son obligatorios'
      });
    }

    const relacion = await obtenerRelacionUsuario(id_usuario, role);

    if (!relacion) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario relacionado no encontrado'
      });
    }

    let sql = `
      SELECT
        conv.id_caso,
        conv.id_cliente,
        conv.id_abogado
      FROM conversaciones conv
      WHERE conv.id_caso = ?
    `;
    const params = [id_caso];

    if (role === 'cliente') {
      sql += ' AND conv.id_cliente = ?';
      params.push(relacion.id);
    } else if (role === 'abogado') {
      sql += ' AND conv.id_abogado = ?';
      params.push(relacion.id);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [rows] = await connection.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'No tienes acceso a este caso para agendar cita'
      });
    }

    const caso = rows[0];

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO citas
      (
        id_caso,
        id_cliente,
        id_abogado,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        modalidad,
        ubicacion,
        link_reunion,
        estado,
        creada_por
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada', ?)`,
      [
        id_caso,
        caso.id_cliente,
        caso.id_abogado,
        titulo,
        descripcion || null,
        fecha_inicio,
        fecha_fin,
        modalidad || 'videollamada',
        ubicacion || null,
        link_reunion || null,
        id_usuario
      ]
    );

    await connection.query(
      `INSERT INTO cita_historial
      (id_cita, accion, detalle, realizada_por)
      VALUES (?, 'creada', ?, ?)`,
      [result.insertId, 'Cita creada', id_usuario]
    );

    const destinatario = role === 'cliente' ? caso.id_abogado : caso.id_cliente;
    const [usuariosDestino] = await connection.query(
      role === 'cliente'
        ? 'SELECT id_usuario FROM abogados WHERE id_abogado = ? LIMIT 1'
        : 'SELECT id_usuario FROM clientes WHERE id_cliente = ? LIMIT 1',
      [destinatario]
    );

    if (usuariosDestino.length > 0) {
      await crearNotificacion({
        id_usuario: usuariosDestino[0].id_usuario,
        tipo_notificacion: 'cita',
        titulo: 'Nueva cita agendada',
        mensaje: `Se agendo la cita "${titulo}" para el caso #${id_caso}.`,
        connection
      });
    }

    await connection.commit();

    return res.status(201).json({
      ok: true,
      message: 'Cita creada correctamente',
      data: {
        id_cita: result.insertId
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en crearCita:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear cita'
    });
  } finally {
    connection.release();
  }
};

const listarMisCitas = async (req, res) => {
  try {
    const { id_usuario, role } = req.user;
    const relacion = await obtenerRelacionUsuario(id_usuario, role);

    if (!relacion) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario relacionado no encontrado'
      });
    }

    let sql = `
      SELECT
        ci.id_cita,
        ci.id_caso,
        ci.titulo,
        ci.descripcion,
        ci.fecha_inicio,
        ci.fecha_fin,
        ci.modalidad,
        ci.ubicacion,
        ci.link_reunion,
        ci.estado,
        ci.creada_por,
        ci.created_at,
        c.folio_caso,
        c.titulo AS titulo_caso,
        uc.nombre AS cliente_nombre,
        uc.apellido_paterno AS cliente_apellido_paterno,
        uc.apellido_materno AS cliente_apellido_materno,
        ua.nombre AS abogado_nombre,
        ua.apellido_paterno AS abogado_apellido_paterno,
        ua.apellido_materno AS abogado_apellido_materno
      FROM citas ci
      INNER JOIN casos c ON c.id_caso = ci.id_caso
      INNER JOIN clientes cl ON cl.id_cliente = ci.id_cliente
      INNER JOIN abogados ab ON ab.id_abogado = ci.id_abogado
      INNER JOIN usuarios uc ON uc.id_usuario = cl.id_usuario
      INNER JOIN usuarios ua ON ua.id_usuario = ab.id_usuario
      WHERE
    `;
    const params = [];

    if (role === 'cliente') {
      sql += ' ci.id_cliente = ? ';
      params.push(relacion.id);
    } else if (role === 'abogado') {
      sql += ' ci.id_abogado = ? ';
      params.push(relacion.id);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    sql += ' ORDER BY ci.fecha_inicio DESC';

    const [rows] = await pool.query(sql, params);

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisCitas:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener citas'
    });
  }
};

const obtenerDetalleCita = async (req, res) => {
  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;
    const relacion = await obtenerRelacionUsuario(id_usuario, role);

    if (!relacion) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario relacionado no encontrado'
      });
    }

    let sql = `
      SELECT
        ci.*,
        c.folio_caso,
        c.titulo AS titulo_caso,
        uc.nombre AS cliente_nombre,
        uc.apellido_paterno AS cliente_apellido_paterno,
        uc.apellido_materno AS cliente_apellido_materno,
        ua.nombre AS abogado_nombre,
        ua.apellido_paterno AS abogado_apellido_paterno,
        ua.apellido_materno AS abogado_apellido_materno
      FROM citas ci
      INNER JOIN casos c ON c.id_caso = ci.id_caso
      INNER JOIN clientes cl ON cl.id_cliente = ci.id_cliente
      INNER JOIN abogados ab ON ab.id_abogado = ci.id_abogado
      INNER JOIN usuarios uc ON uc.id_usuario = cl.id_usuario
      INNER JOIN usuarios ua ON ua.id_usuario = ab.id_usuario
      WHERE ci.id_cita = ?
    `;
    const params = [id];

    if (role === 'cliente') {
      sql += ' AND ci.id_cliente = ?';
      params.push(relacion.id);
    } else if (role === 'abogado') {
      sql += ' AND ci.id_abogado = ?';
      params.push(relacion.id);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [citas] = await pool.query(sql, params);

    if (citas.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Cita no encontrada'
      });
    }

    const [historial] = await pool.query(
      `SELECT
        ch.id_cita_historial,
        ch.accion,
        ch.detalle,
        ch.realizada_por,
        ch.created_at,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno
      FROM cita_historial ch
      LEFT JOIN usuarios u ON u.id_usuario = ch.realizada_por
      WHERE ch.id_cita = ?
      ORDER BY ch.id_cita_historial DESC`,
      [id]
    );

    return res.json({
      ok: true,
      data: {
        cita: citas[0],
        historial
      }
    });
  } catch (error) {
    console.error('Error en obtenerDetalleCita:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener detalle de cita'
    });
  }
};

const actualizarCita = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      modalidad,
      ubicacion,
      link_reunion
    } = req.body;

    if (!titulo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        ok: false,
        message: 'titulo, fecha_inicio y fecha_fin son obligatorios'
      });
    }

    const relacion = await obtenerRelacionUsuario(id_usuario, role);

    if (!relacion) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario relacionado no encontrado'
      });
    }

    let sql = 'SELECT * FROM citas WHERE id_cita = ?';
    const params = [id];

    if (role === 'cliente') {
      sql += ' AND id_cliente = ?';
      params.push(relacion.id);
    } else if (role === 'abogado') {
      sql += ' AND id_abogado = ?';
      params.push(relacion.id);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [rows] = await connection.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Cita no encontrada'
      });
    }

    const cita = rows[0];

    if (['cancelada', 'completada'].includes(cita.estado)) {
      return res.status(400).json({
        ok: false,
        message: 'No puedes editar una cita cancelada o completada'
      });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE citas
       SET titulo = ?,
           descripcion = ?,
           fecha_inicio = ?,
           fecha_fin = ?,
           modalidad = ?,
           ubicacion = ?,
           link_reunion = ?,
           estado = 'reprogramada',
           updated_at = CURRENT_TIMESTAMP
       WHERE id_cita = ?`,
      [
        titulo,
        descripcion || null,
        fecha_inicio,
        fecha_fin,
        modalidad || 'videollamada',
        ubicacion || null,
        link_reunion || null,
        id
      ]
    );

    await connection.query(
      `INSERT INTO cita_historial
      (id_cita, accion, detalle, realizada_por)
      VALUES (?, 'reprogramada', ?, ?)`,
      [id, `Cita reprogramada para ${fecha_inicio}`, id_usuario]
    );

    const destinatario = role === 'cliente' ? cita.id_abogado : cita.id_cliente;
    const [usuariosDestino] = await connection.query(
      role === 'cliente'
        ? 'SELECT id_usuario FROM abogados WHERE id_abogado = ? LIMIT 1'
        : 'SELECT id_usuario FROM clientes WHERE id_cliente = ? LIMIT 1',
      [destinatario]
    );

    if (usuariosDestino.length > 0) {
      await crearNotificacion({
        id_usuario: usuariosDestino[0].id_usuario,
        tipo_notificacion: 'cita',
        titulo: 'Cita reprogramada',
        mensaje: `La cita "${titulo}" del caso #${cita.id_caso} fue reprogramada.`,
        connection
      });
    }

    await connection.commit();

    return res.json({
      ok: true,
      message: 'Cita actualizada correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en actualizarCita:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar cita'
    });
  } finally {
    connection.release();
  }
};

const actualizarEstadoCita = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = ['confirmada', 'cancelada', 'reprogramada', 'completada'];

    if (!estado || !estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: 'Estado inválido'
      });
    }

    const relacion = await obtenerRelacionUsuario(id_usuario, role);

    if (!relacion) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario relacionado no encontrado'
      });
    }

    let sql = 'SELECT * FROM citas WHERE id_cita = ?';
    const params = [id];

    if (role === 'cliente') {
      sql += ' AND id_cliente = ?';
      params.push(relacion.id);
    } else if (role === 'abogado') {
      sql += ' AND id_abogado = ?';
      params.push(relacion.id);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [rows] = await connection.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Cita no encontrada'
      });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE citas
       SET estado = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_cita = ?`,
      [estado, id]
    );

    await connection.query(
      `INSERT INTO cita_historial
      (id_cita, accion, detalle, realizada_por)
      VALUES (?, ?, ?, ?)`,
      [id, estado, `Estado cambiado a ${estado}`, id_usuario]
    );

    const destinatario = role === 'cliente' ? rows[0].id_abogado : rows[0].id_cliente;
    const [usuariosDestino] = await connection.query(
      role === 'cliente'
        ? 'SELECT id_usuario FROM abogados WHERE id_abogado = ? LIMIT 1'
        : 'SELECT id_usuario FROM clientes WHERE id_cliente = ? LIMIT 1',
      [destinatario]
    );

    if (usuariosDestino.length > 0) {
      await crearNotificacion({
        id_usuario: usuariosDestino[0].id_usuario,
        tipo_notificacion: 'cita',
        titulo: 'Actualizacion de cita',
        mensaje: `La cita del caso #${rows[0].id_caso} cambio a estado ${estado}.`,
        connection
      });
    }

    await connection.commit();

    return res.json({
      ok: true,
      message: 'Estado de cita actualizado correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en actualizarEstadoCita:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar cita'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  crearCita,
  listarMisCitas,
  obtenerDetalleCita,
  actualizarCita,
  actualizarEstadoCita
};

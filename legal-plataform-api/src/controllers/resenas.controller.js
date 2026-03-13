const { pool } = require('../config/db');

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

const obtenerDetalleCasoAsignado = async (req, res) => {
  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;

    const relacion = await obtenerRelacionUsuario(id_usuario, role);

    if (!relacion) {
      return res.status(404).json({
        ok: false,
        message: 'Perfil relacionado no encontrado'
      });
    }

    let sql = `
      SELECT
        c.id_caso,
        c.folio_caso,
        c.titulo,
        c.descripcion,
        c.estado,
        c.created_at,
        c.fecha_cierre,
        ca.id_asignacion,
        ca.id_abogado,
        ca.monto_acordado,
        ca.porcentaje_comision,
        ca.monto_comision,
        ca.monto_neto_abogado,
        ca.estado_servicio
      FROM casos c
      INNER JOIN caso_asignaciones ca ON ca.id_caso = c.id_caso
      WHERE c.id_caso = ?
    `;
    const params = [id];

    if (role === 'cliente') {
      sql += ' AND c.id_cliente = ?';
      params.push(relacion.id);
    } else if (role === 'abogado') {
      sql += ' AND ca.id_abogado = ?';
      params.push(relacion.id);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [rows] = await pool.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso asignado no encontrado'
      });
    }

    const caso = rows[0];

    const [resenas] = await pool.query(
      `SELECT
        id_resena,
        calificacion,
        comentario,
        estatus,
        respuesta_abogado,
        fecha_respuesta,
        created_at
      FROM resenas
      WHERE id_caso = ?
      LIMIT 1`,
      [id]
    );

    caso.resena = resenas.length ? resenas[0] : null;

    return res.json({
      ok: true,
      data: caso
    });
  } catch (error) {
    console.error('Error en obtenerDetalleCasoAsignado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener detalle del caso'
    });
  }
};

const completarCaso = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;

    const relacion = await obtenerRelacionUsuario(id_usuario, role);

    if (!relacion) {
      return res.status(404).json({
        ok: false,
        message: 'Perfil relacionado no encontrado'
      });
    }

    let sql = `
      SELECT
        c.id_caso,
        c.estado,
        ca.id_asignacion,
        ca.estado_servicio
      FROM casos c
      INNER JOIN caso_asignaciones ca ON ca.id_caso = c.id_caso
      WHERE c.id_caso = ?
    `;
    const params = [id];

    if (role === 'cliente') {
      sql += ' AND c.id_cliente = ?';
      params.push(relacion.id);
    } else if (role === 'abogado') {
      sql += ' AND ca.id_abogado = ?';
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
        message: 'Caso no encontrado'
      });
    }

    const caso = rows[0];

    if (caso.estado !== 'en_proceso') {
      return res.status(400).json({
        ok: false,
        message: 'Solo se pueden completar casos en proceso'
      });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE casos
       SET estado = 'finalizado',
           fecha_cierre = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id_caso = ?`,
      [id]
    );

    await connection.query(
      `UPDATE caso_asignaciones
       SET estado_servicio = 'completado',
           updated_at = CURRENT_TIMESTAMP
       WHERE id_asignacion = ?`,
      [caso.id_asignacion]
    );

    await connection.commit();

    return res.json({
      ok: true,
      message: 'Caso marcado como completado correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en completarCaso:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al completar caso'
    });
  } finally {
    connection.release();
  }
};

const crearResena = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { calificacion, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        ok: false,
        message: 'La calificación debe estar entre 1 y 5'
      });
    }

    const [clientes] = await pool.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
      [id_usuario]
    );

    if (clientes.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Cliente no encontrado'
      });
    }

    const id_cliente = clientes[0].id_cliente;

    const [casos] = await pool.query(
      `SELECT
        c.id_caso,
        c.estado,
        ca.id_abogado,
        ca.estado_servicio
      FROM casos c
      INNER JOIN caso_asignaciones ca ON ca.id_caso = c.id_caso
      WHERE c.id_caso = ?
        AND c.id_cliente = ?
      LIMIT 1`,
      [id, id_cliente]
    );

    if (casos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado'
      });
    }

    const caso = casos[0];

    if (caso.estado !== 'finalizado' || caso.estado_servicio !== 'completado') {
      return res.status(400).json({
        ok: false,
        message: 'Solo puedes reseñar casos finalizados'
      });
    }

    const [resenaExistente] = await pool.query(
      'SELECT id_resena FROM resenas WHERE id_caso = ? LIMIT 1',
      [id]
    );

    if (resenaExistente.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe una reseña para este caso'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO resenas
      (id_caso, id_cliente, id_abogado, calificacion, comentario, estatus)
      VALUES (?, ?, ?, ?, ?, 'publicada')`,
      [
        id,
        id_cliente,
        caso.id_abogado,
        Number(calificacion),
        comentario || null
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Reseña creada correctamente',
      data: {
        id_resena: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en crearResena:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear reseña'
    });
  }
};

const listarResenasAbogado = async (req, res) => {
  try {
    const { id_abogado } = req.params;

    const [rows] = await pool.query(
      `SELECT
        r.id_resena,
        r.id_caso,
        r.calificacion,
        r.comentario,
        r.estatus,
        r.respuesta_abogado,
        r.fecha_respuesta,
        r.created_at,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno
      FROM resenas r
      INNER JOIN clientes c ON c.id_cliente = r.id_cliente
      INNER JOIN usuarios u ON u.id_usuario = c.id_usuario
      WHERE r.id_abogado = ?
        AND r.estatus = 'publicada'
      ORDER BY r.id_resena DESC`,
      [id_abogado]
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarResenasAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener reseñas'
    });
  }
};

const responderResena = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { respuesta_abogado } = req.body;

    if (!respuesta_abogado || !respuesta_abogado.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'La respuesta es obligatoria'
      });
    }

    const [abogados] = await pool.query(
      'SELECT id_abogado FROM abogados WHERE id_usuario = ? LIMIT 1',
      [id_usuario]
    );

    if (abogados.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const id_abogado = abogados[0].id_abogado;

    const [resenas] = await pool.query(
      'SELECT id_resena FROM resenas WHERE id_resena = ? AND id_abogado = ? LIMIT 1',
      [id, id_abogado]
    );

    if (resenas.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Reseña no encontrada'
      });
    }

    await pool.query(
      `UPDATE resenas
       SET respuesta_abogado = ?,
           fecha_respuesta = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id_resena = ?`,
      [respuesta_abogado.trim(), id]
    );

    return res.json({
      ok: true,
      message: 'Respuesta guardada correctamente'
    });
  } catch (error) {
    console.error('Error en responderResena:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al responder reseña'
    });
  }
};

module.exports = {
  obtenerDetalleCasoAsignado,
  completarCaso,
  crearResena,
  listarResenasAbogado,
  responderResena
};
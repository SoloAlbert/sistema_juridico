const { pool } = require('../config/db');

const generarFolioCaso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CASO-${y}${m}${d}-${rand}`;
};

const crearCaso = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const {
      id_especialidad,
      titulo,
      descripcion,
      urgencia,
      presupuesto_min,
      presupuesto_max,
      modalidad_preferida,
      ciudad,
      estado_republica,
      fecha_limite_respuesta
    } = req.body;

    if (!id_especialidad || !titulo || !descripcion) {
      return res.status(400).json({
        ok: false,
        message: 'id_especialidad, titulo y descripcion son obligatorios'
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
    const folio_caso = generarFolioCaso();

    const [result] = await pool.query(
      `INSERT INTO casos
      (
        folio_caso,
        id_cliente,
        id_especialidad,
        titulo,
        descripcion,
        urgencia,
        presupuesto_min,
        presupuesto_max,
        modalidad_preferida,
        estado,
        ciudad,
        estado_republica,
        fecha_limite_respuesta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'publicado', ?, ?, ?)`,
      [
        folio_caso,
        id_cliente,
        id_especialidad,
        titulo,
        descripcion,
        urgencia || 'media',
        presupuesto_min || null,
        presupuesto_max || null,
        modalidad_preferida || 'indistinto',
        ciudad || null,
        estado_republica || null,
        fecha_limite_respuesta || null
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Caso creado correctamente',
      data: {
        id_caso: result.insertId,
        folio_caso
      }
    });
  } catch (error) {
    console.error('Error en crearCaso:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear caso'
    });
  }
};

const listarMisCasosCliente = async (req, res) => {
  try {
    const { id_usuario } = req.user;

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

    const [rows] = await pool.query(
      `SELECT
        c.id_caso,
        c.folio_caso,
        c.id_especialidad,
        e.nombre AS especialidad,
        c.titulo,
        c.descripcion,
        c.urgencia,
        c.presupuesto_min,
        c.presupuesto_max,
        c.modalidad_preferida,
        c.estado,
        c.ciudad,
        c.estado_republica,
        c.fecha_limite_respuesta,
        c.fecha_cierre,
        c.created_at,
        (
          SELECT COUNT(*)
          FROM caso_postulaciones cp
          WHERE cp.id_caso = c.id_caso
        ) AS total_postulaciones
      FROM casos c
      INNER JOIN especialidades e ON e.id_especialidad = c.id_especialidad
      WHERE c.id_cliente = ?
      ORDER BY c.id_caso DESC`,
      [id_cliente]
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisCasosCliente:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener casos del cliente'
    });
  }
};

const obtenerMiCasoCliente = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;

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
        c.*,
        e.nombre AS especialidad
      FROM casos c
      INNER JOIN especialidades e ON e.id_especialidad = c.id_especialidad
      WHERE c.id_caso = ? AND c.id_cliente = ?
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

    const [postulaciones] = await pool.query(
      `SELECT
        cp.id_postulacion,
        cp.id_abogado,
        cp.mensaje_propuesta,
        cp.monto_propuesto,
        cp.tiempo_estimado_dias,
        cp.estado,
        cp.created_at,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.telefono,
        a.nombre_despacho,
        a.biografia_corta,
        a.anos_experiencia,
        a.modalidad_atencion,
        a.rating_promedio,
        a.total_resenas
      FROM caso_postulaciones cp
      INNER JOIN abogados a ON a.id_abogado = cp.id_abogado
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      WHERE cp.id_caso = ?
      ORDER BY cp.id_postulacion DESC`,
      [id]
    );

    caso.postulaciones = postulaciones;

    return res.json({
      ok: true,
      data: caso
    });
  } catch (error) {
    console.error('Error en obtenerMiCasoCliente:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el caso'
    });
  }
};

const listarCasosDisponiblesAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id_especialidad, urgencia, modalidad } = req.query;

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

    let sql = `
      SELECT
        c.id_caso,
        c.folio_caso,
        c.id_especialidad,
        e.nombre AS especialidad,
        c.titulo,
        c.descripcion,
        c.urgencia,
        c.presupuesto_min,
        c.presupuesto_max,
        c.modalidad_preferida,
        c.estado,
        c.ciudad,
        c.estado_republica,
        c.fecha_limite_respuesta,
        c.created_at,
        EXISTS(
          SELECT 1
          FROM caso_postulaciones cp
          WHERE cp.id_caso = c.id_caso
            AND cp.id_abogado = ?
        ) AS ya_postulado
      FROM casos c
      INNER JOIN especialidades e ON e.id_especialidad = c.id_especialidad
      WHERE c.estado = 'publicado'
    `;

    const params = [id_abogado];

    if (id_especialidad) {
      sql += ' AND c.id_especialidad = ?';
      params.push(id_especialidad);
    }

    if (urgencia) {
      sql += ' AND c.urgencia = ?';
      params.push(urgencia);
    }

    if (modalidad) {
      sql += ' AND c.modalidad_preferida = ?';
      params.push(modalidad);
    }

    sql += ' ORDER BY c.id_caso DESC';

    const [rows] = await pool.query(sql, params);

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarCasosDisponiblesAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener casos disponibles'
    });
  }
};

const obtenerCasoDisponibleAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;

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

    const [rows] = await pool.query(
      `SELECT
        c.id_caso,
        c.folio_caso,
        c.id_especialidad,
        e.nombre AS especialidad,
        c.titulo,
        c.descripcion,
        c.urgencia,
        c.presupuesto_min,
        c.presupuesto_max,
        c.modalidad_preferida,
        c.estado,
        c.ciudad,
        c.estado_republica,
        c.fecha_limite_respuesta,
        c.created_at,
        EXISTS(
          SELECT 1
          FROM caso_postulaciones cp
          WHERE cp.id_caso = c.id_caso
            AND cp.id_abogado = ?
        ) AS ya_postulado
      FROM casos c
      INNER JOIN especialidades e ON e.id_especialidad = c.id_especialidad
      WHERE c.id_caso = ?
        AND c.estado = 'publicado'
      LIMIT 1`,
      [id_abogado, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado o no disponible'
      });
    }

    return res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en obtenerCasoDisponibleAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener caso'
    });
  }
};

const postularmeACaso = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { mensaje_propuesta, monto_propuesto, tiempo_estimado_dias } = req.body;

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

    const [casos] = await pool.query(
      'SELECT id_caso, estado FROM casos WHERE id_caso = ? LIMIT 1',
      [id]
    );

    if (casos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado'
      });
    }

    if (casos[0].estado !== 'publicado') {
      return res.status(400).json({
        ok: false,
        message: 'Solo puedes postularte a casos publicados'
      });
    }

    const [existente] = await pool.query(
      'SELECT id_postulacion FROM caso_postulaciones WHERE id_caso = ? AND id_abogado = ? LIMIT 1',
      [id, id_abogado]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya te postulaste a este caso'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO caso_postulaciones
      (id_caso, id_abogado, mensaje_propuesta, monto_propuesto, tiempo_estimado_dias, estado)
      VALUES (?, ?, ?, ?, ?, 'enviada')`,
      [
        id,
        id_abogado,
        mensaje_propuesta || null,
        monto_propuesto || null,
        tiempo_estimado_dias || null
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Postulación enviada correctamente',
      data: {
        id_postulacion: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en postularmeACaso:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al postularse al caso'
    });
  }
};

const asignarAbogadoACaso = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { id_abogado, monto_acordado, porcentaje_comision } = req.body;

    if (!id_abogado || !monto_acordado) {
      return res.status(400).json({
        ok: false,
        message: 'id_abogado y monto_acordado son obligatorios'
      });
    }

    const [clientes] = await connection.query(
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

    const [casos] = await connection.query(
      'SELECT id_caso, estado FROM casos WHERE id_caso = ? AND id_cliente = ? LIMIT 1',
      [id, id_cliente]
    );

    if (casos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado'
      });
    }

    if (casos[0].estado !== 'publicado') {
      return res.status(400).json({
        ok: false,
        message: 'El caso ya no está disponible para asignación'
      });
    }

    const [postulaciones] = await connection.query(
      `SELECT id_postulacion
       FROM caso_postulaciones
       WHERE id_caso = ? AND id_abogado = ? AND estado = 'enviada'
       LIMIT 1`,
      [id, id_abogado]
    );

    if (postulaciones.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Ese abogado no tiene una postulación válida para este caso'
      });
    }

    const pct = Number(porcentaje_comision || 3);
    const monto = Number(monto_acordado);
    const monto_comision = Number(((monto * pct) / 100).toFixed(2));
    const monto_neto_abogado = Number((monto - monto_comision).toFixed(2));

    await connection.beginTransaction();

    const [resultAsignacion] = await connection.query(
      `INSERT INTO caso_asignaciones
      (id_caso, id_abogado, monto_acordado, porcentaje_comision, monto_comision, monto_neto_abogado, estado_servicio)
      VALUES (?, ?, ?, ?, ?, ?, 'pendiente_pago')`,
      [id, id_abogado, monto, pct, monto_comision, monto_neto_abogado]
    );

    await connection.query(
      `UPDATE casos
       SET estado = 'asignado', updated_at = CURRENT_TIMESTAMP
       WHERE id_caso = ?`,
      [id]
    );

    await connection.query(
      `UPDATE caso_postulaciones
       SET estado = CASE
         WHEN id_abogado = ? THEN 'aceptada'
         ELSE 'rechazada'
       END,
       updated_at = CURRENT_TIMESTAMP
       WHERE id_caso = ?`,
      [id_abogado, id]
    );

    await connection.commit();

    return res.json({
      ok: true,
      message: 'Abogado asignado correctamente',
      data: {
        id_asignacion: resultAsignacion.insertId,
        monto_acordado: monto,
        porcentaje_comision: pct,
        monto_comision,
        monto_neto_abogado
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en asignarAbogadoACaso:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al asignar abogado al caso'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  crearCaso,
  listarMisCasosCliente,
  obtenerMiCasoCliente,
  listarCasosDisponiblesAbogado,
  obtenerCasoDisponibleAbogado,
  postularmeACaso,
  asignarAbogadoACaso
};
const { pool } = require('../config/db');
const { crearNotificacion, crearNotificacionesMasivas } = require('../services/notificaciones.service');

const generarFolioCaso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CASO-${y}${m}${d}-${rand}`;
};

const obtenerIdAbogadoPorUsuario = async (id_usuario, connection = pool) => {
  const [abogados] = await connection.query(
    'SELECT id_abogado FROM abogados WHERE id_usuario = ? LIMIT 1',
    [id_usuario]
  );

  return abogados.length > 0 ? abogados[0].id_abogado : null;
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

    const [sugeridos] = await pool.query(
      `SELECT
        a.id_abogado,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.telefono,
        u.foto_perfil,
        a.nombre_despacho,
        a.biografia_corta,
        a.anos_experiencia,
        a.modalidad_atencion,
        a.precio_consulta_base,
        a.moneda,
        a.rating_promedio,
        a.total_resenas,
        a.total_casos,
        COALESCE(av.badge_verificado, 0) AS badge_verificado,
        av.estatus_general AS estatus_verificacion,
        d.ciudad,
        d.estado,
        (
          SELECT COUNT(*)
          FROM abogado_disponibilidad ad
          WHERE ad.id_abogado = a.id_abogado
            AND ad.activo = 1
            AND (
              c.modalidad_preferida = 'indistinto'
              OR ad.modalidad = c.modalidad_preferida
              OR a.modalidad_atencion = 'ambas'
            )
        ) AS disponibilidad_activa,
        (
          (CASE WHEN ae.id_especialidad = c.id_especialidad THEN 40 ELSE 0 END) +
          (CASE WHEN d.estado <=> c.estado_republica THEN 15 ELSE 0 END) +
          (CASE WHEN d.ciudad <=> c.ciudad THEN 10 ELSE 0 END) +
          (CASE WHEN COALESCE(av.badge_verificado, 0) = 1 THEN 15 ELSE 0 END) +
          (LEAST(a.anos_experiencia, 20)) +
          (LEAST(a.rating_promedio * 2, 10)) +
          (CASE
            WHEN c.modalidad_preferida = 'indistinto' THEN 5
            WHEN a.modalidad_atencion = 'ambas' THEN 5
            WHEN a.modalidad_atencion = c.modalidad_preferida THEN 5
            ELSE 0
          END) +
          (CASE
            WHEN c.presupuesto_max IS NULL OR c.presupuesto_max = 0 THEN 0
            WHEN a.precio_consulta_base <= c.presupuesto_max THEN 5
            ELSE 0
          END)
        ) AS puntaje_match
      FROM casos c
      INNER JOIN abogado_especialidad ae ON ae.id_especialidad = c.id_especialidad
      INNER JOIN abogados a ON a.id_abogado = ae.id_abogado
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      LEFT JOIN abogado_verificaciones av ON av.id_abogado = a.id_abogado
      LEFT JOIN direcciones d ON d.id_usuario = u.id_usuario
      WHERE c.id_caso = ?
        AND a.acepta_nuevos_casos = 1
      GROUP BY
        a.id_abogado,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.telefono,
        u.foto_perfil,
        a.nombre_despacho,
        a.biografia_corta,
        a.anos_experiencia,
        a.modalidad_atencion,
        a.precio_consulta_base,
        a.moneda,
        a.rating_promedio,
        a.total_resenas,
        a.total_casos,
        av.badge_verificado,
        av.estatus_general,
        d.ciudad,
        d.estado,
        c.id_especialidad,
        c.ciudad,
        c.estado_republica,
        c.modalidad_preferida,
        c.presupuesto_max
      ORDER BY puntaje_match DESC, a.rating_promedio DESC, a.total_resenas DESC, a.total_casos DESC
      LIMIT 8`,
      [id]
    );

    caso.abogados_sugeridos = sugeridos.map((item) => ({
      ...item,
      badge_verificado: !!item.badge_verificado,
      puntaje_match: Number(item.puntaje_match || 0),
      rating_promedio: Number(item.rating_promedio || 0),
      total_resenas: Number(item.total_resenas || 0),
      total_casos: Number(item.total_casos || 0),
      anos_experiencia: Number(item.anos_experiencia || 0),
      precio_consulta_base: Number(item.precio_consulta_base || 0),
      disponibilidad_activa: Number(item.disponibilidad_activa || 0)
    }));

    const [pagos] = await pool.query(
      `SELECT
        id_pago,
        estatus_pago,
        fecha_pago,
        created_at
      FROM pagos
      WHERE id_caso = ?
      ORDER BY id_pago DESC`,
      [id]
    );

    const [conversaciones] = await pool.query(
      `SELECT
        id_conversacion,
        estado,
        created_at
      FROM conversaciones
      WHERE id_caso = ?
      ORDER BY id_conversacion DESC
      LIMIT 1`,
      [id]
    );

    const [citas] = await pool.query(
      `SELECT
        id_cita,
        titulo,
        modalidad,
        estado,
        fecha_inicio,
        fecha_fin,
        created_at
      FROM citas
      WHERE id_caso = ?
      ORDER BY fecha_inicio DESC, id_cita DESC`,
      [id]
    );

    const [documentos] = await pool.query(
      `SELECT
        id_documento_generado,
        titulo_documento,
        formato_salida,
        estatus,
        created_at
      FROM documentos_generados
      WHERE id_caso = ?
      ORDER BY id_documento_generado DESC`,
      [id]
    );

    const [archivosCaso] = await pool.query(
      `SELECT
        id_archivo,
        nombre_archivo,
        created_at
      FROM caso_archivos
      WHERE id_caso = ?
      ORDER BY id_archivo DESC`,
      [id]
    );

    const timeline = [
      {
        clave: 'caso_recibido',
        titulo: 'Caso recibido',
        descripcion: 'El cliente publico el caso en la plataforma',
        estado: 'completado',
        fecha: caso.created_at
      },
      {
        clave: 'en_revision',
        titulo: 'En revision',
        descripcion: caso.postulaciones.length > 0
          ? `Se recibieron ${caso.postulaciones.length} postulacion(es)`
          : 'Esperando interes de abogados',
        estado: caso.postulaciones.length > 0 ? 'completado' : 'pendiente',
        fecha: caso.postulaciones.length > 0 ? caso.postulaciones[caso.postulaciones.length - 1].created_at : null
      },
      {
        clave: 'en_proceso',
        titulo: 'En proceso',
        descripcion: pagos.length > 0
          ? 'El caso ya tiene pago registrado y atencion activa'
          : caso.estado === 'asignado'
            ? 'Hay abogado asignado pendiente de pago'
            : 'Pendiente de asignacion y pago',
        estado: ['en_proceso', 'finalizado'].includes(caso.estado)
          ? 'completado'
          : caso.estado === 'asignado'
            ? 'actual'
            : 'pendiente',
        fecha: pagos[0]?.fecha_pago || pagos[0]?.created_at || null
      },
      {
        clave: 'esperando_documentos',
        titulo: 'Esperando documentos',
        descripcion: archivosCaso.length > 0
          ? `${archivosCaso.length} archivo(s) cargado(s) por el cliente`
          : 'Aun no hay documentos adjuntos del cliente',
        estado: archivosCaso.length > 0 ? 'completado' : 'pendiente',
        fecha: archivosCaso.length > 0 ? archivosCaso[0].created_at : null
      },
      {
        clave: 'documento_generado',
        titulo: 'Documento generado',
        descripcion: documentos.length > 0
          ? `${documentos.length} documento(s) generado(s) para el caso`
          : 'Todavia no se genera un documento desde este caso',
        estado: documentos.length > 0 ? 'completado' : 'pendiente',
        fecha: documentos[0]?.created_at || null
      },
      {
        clave: 'reunion_agendada',
        titulo: 'Reunion agendada',
        descripcion: citas.length > 0
          ? `${citas.length} cita(s) registrada(s)`
          : 'Sin reuniones programadas por ahora',
        estado: citas.length > 0 ? 'completado' : 'pendiente',
        fecha: citas[0]?.fecha_inicio || null
      },
      {
        clave: 'cerrado',
        titulo: 'Cerrado',
        descripcion: caso.estado === 'finalizado'
          ? 'El caso fue cerrado y marcado como finalizado'
          : 'El caso aun sigue abierto',
        estado: caso.estado === 'finalizado' ? 'completado' : 'pendiente',
        fecha: caso.fecha_cierre || null
      }
    ];

    caso.seguimiento = {
      estado_actual: caso.estado,
      conversacion_activa: conversaciones.length > 0,
      total_postulaciones: caso.postulaciones.length,
      total_archivos: archivosCaso.length,
      total_documentos_generados: documentos.length,
      total_citas: citas.length,
      pagos,
      conversacion: conversaciones[0] || null,
      citas,
      documentos,
      timeline
    };

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

const listarMisCasosAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const id_abogado = await obtenerIdAbogadoPorUsuario(id_usuario);

    if (!id_abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        c.id_caso,
        c.folio_caso,
        c.titulo,
        c.descripcion,
        c.urgencia,
        c.modalidad_preferida,
        c.estado,
        c.ciudad,
        c.estado_republica,
        c.created_at,
        e.nombre AS especialidad,
        ca.monto_acordado,
        ca.estado_servicio,
        ca.fecha_asignacion,
        u.nombre AS cliente_nombre,
        u.apellido_paterno AS cliente_apellido_paterno,
        u.apellido_materno AS cliente_apellido_materno,
        (
          SELECT COUNT(*)
          FROM caso_archivos car
          WHERE car.id_caso = c.id_caso
        ) AS total_archivos,
        (
          SELECT COUNT(*)
          FROM documentos_generados dg
          WHERE dg.id_caso = c.id_caso
            AND dg.id_abogado = ca.id_abogado
        ) AS total_documentos,
        (
          SELECT COUNT(*)
          FROM citas ci
          WHERE ci.id_caso = c.id_caso
            AND ci.id_abogado = ca.id_abogado
        ) AS total_citas
      FROM caso_asignaciones ca
      INNER JOIN casos c ON c.id_caso = ca.id_caso
      INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON u.id_usuario = cl.id_usuario
      INNER JOIN especialidades e ON e.id_especialidad = c.id_especialidad
      WHERE ca.id_abogado = ?
      ORDER BY c.updated_at DESC, c.id_caso DESC`,
      [id_abogado]
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisCasosAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener mis casos'
    });
  }
};

const obtenerMiCasoAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const id_abogado = await obtenerIdAbogadoPorUsuario(id_usuario);

    if (!id_abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const [casos] = await pool.query(
      `SELECT
        c.*,
        e.nombre AS especialidad,
        ca.id_asignacion,
        ca.monto_acordado,
        ca.porcentaje_comision,
        ca.monto_comision,
        ca.monto_neto_abogado,
        ca.estado_servicio,
        ca.fecha_asignacion,
        cl.id_cliente,
        u.nombre AS cliente_nombre,
        u.apellido_paterno AS cliente_apellido_paterno,
        u.apellido_materno AS cliente_apellido_materno,
        u.email AS cliente_email,
        u.telefono AS cliente_telefono
      FROM caso_asignaciones ca
      INNER JOIN casos c ON c.id_caso = ca.id_caso
      INNER JOIN especialidades e ON e.id_especialidad = c.id_especialidad
      INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON u.id_usuario = cl.id_usuario
      WHERE ca.id_abogado = ?
        AND c.id_caso = ?
      LIMIT 1`,
      [id_abogado, id]
    );

    if (casos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado'
      });
    }

    const caso = casos[0];

    const [archivos] = await pool.query(
      `SELECT
        id_archivo,
        nombre_archivo,
        ruta_archivo,
        mime_type,
        tamano_bytes,
        created_at
      FROM caso_archivos
      WHERE id_caso = ?
      ORDER BY id_archivo DESC`,
      [id]
    );

    const [documentos] = await pool.query(
      `SELECT
        id_documento_generado,
        titulo_documento,
        ruta_archivo_generado,
        formato_salida,
        estatus,
        created_at
      FROM documentos_generados
      WHERE id_caso = ?
        AND id_abogado = ?
      ORDER BY id_documento_generado DESC`,
      [id, id_abogado]
    );

    const [pagos] = await pool.query(
      `SELECT
        id_pago,
        monto_bruto,
        porcentaje_comision,
        monto_comision,
        monto_neto_abogado,
        moneda,
        estatus_pago,
        fecha_pago
      FROM pagos
      WHERE id_caso = ?
        AND id_abogado = ?
      ORDER BY id_pago DESC`,
      [id, id_abogado]
    );

    const [citas] = await pool.query(
      `SELECT
        id_cita,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        modalidad,
        ubicacion,
        link_reunion,
        estado,
        created_at
      FROM citas
      WHERE id_caso = ?
        AND id_abogado = ?
      ORDER BY fecha_inicio DESC, id_cita DESC`,
      [id, id_abogado]
    );

    const [conversaciones] = await pool.query(
      `SELECT id_conversacion, estado, created_at
       FROM conversaciones
       WHERE id_caso = ?
         AND id_abogado = ?
       LIMIT 1`,
      [id, id_abogado]
    );

    const conversacion = conversaciones[0] || null;

    let mensajesRecientes = [];
    if (conversacion) {
      const [mensajes] = await pool.query(
        `SELECT
          m.id_mensaje,
          m.tipo_mensaje,
          m.mensaje,
          m.leido,
          m.created_at,
          u.nombre,
          u.apellido_paterno,
          u.apellido_materno
        FROM mensajes m
        INNER JOIN usuarios u ON u.id_usuario = m.id_remitente
        WHERE m.id_conversacion = ?
        ORDER BY m.id_mensaje DESC
        LIMIT 8`,
        [conversacion.id_conversacion]
      );

      mensajesRecientes = mensajes.reverse();
    }

    let notasPrivadas = [];
    try {
      const [notas] = await pool.query(
        `SELECT
          id_nota_privada,
          nota,
          created_at,
          updated_at
        FROM caso_notas_privadas
        WHERE id_caso = ?
          AND id_abogado = ?
        ORDER BY id_nota_privada DESC`,
        [id, id_abogado]
      );
      notasPrivadas = notas;
    } catch (notesError) {
      if (notesError.code !== 'ER_NO_SUCH_TABLE') {
        throw notesError;
      }
    }

    caso.archivos = archivos;
    caso.documentos = documentos;
    caso.pagos = pagos;
    caso.citas = citas;
    caso.conversacion = conversacion;
    caso.mensajes_recientes = mensajesRecientes;
    caso.notas_privadas = notasPrivadas;

    const historial = [
      {
        clave: 'caso_creado',
        titulo: 'Caso creado',
        descripcion: 'El cliente registró el caso en la plataforma',
        fecha: caso.created_at
      },
      {
        clave: 'asignacion',
        titulo: 'Caso asignado',
        descripcion: `Asignado al abogado con monto acordado de $${Number(caso.monto_acordado || 0).toFixed(2)}`,
        fecha: caso.fecha_asignacion
      },
      ...pagos.map((item) => ({
        clave: `pago_${item.id_pago}`,
        titulo: 'Pago registrado',
        descripcion: `Pago ${item.estatus_pago} por $${Number(item.monto_bruto || 0).toFixed(2)}`,
        fecha: item.fecha_pago || null
      })),
      ...citas.map((item) => ({
        clave: `cita_${item.id_cita}`,
        titulo: 'Cita registrada',
        descripcion: `${item.titulo} · ${item.modalidad} · ${item.estado}`,
        fecha: item.fecha_inicio || item.created_at
      })),
      ...documentos.map((item) => ({
        clave: `documento_${item.id_documento_generado}`,
        titulo: 'Documento generado',
        descripcion: `${item.titulo_documento} · ${item.formato_salida} · ${item.estatus}`,
        fecha: item.created_at
      })),
      ...notasPrivadas.map((item) => ({
        clave: `nota_${item.id_nota_privada}`,
        titulo: 'Nota privada',
        descripcion: item.nota,
        fecha: item.created_at
      }))
    ]
      .filter((item) => item.fecha)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    caso.historial = historial;

    return res.json({
      ok: true,
      data: caso
    });
  } catch (error) {
    console.error('Error en obtenerMiCasoAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener detalle del caso'
    });
  }
};

const actualizarEstadoCasoAbogado = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { estado } = req.body;
    const id_abogado = await obtenerIdAbogadoPorUsuario(id_usuario, connection);

    if (!id_abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const estadosPermitidos = ['en_proceso', 'cancelado'];

    if (!estado || !estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: 'Estado inválido'
      });
    }

    const [casos] = await connection.query(
      `SELECT ca.id_asignacion
       FROM caso_asignaciones ca
       INNER JOIN casos c ON c.id_caso = ca.id_caso
       WHERE ca.id_abogado = ?
         AND c.id_caso = ?
       LIMIT 1`,
      [id_abogado, id]
    );

    if (casos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado'
      });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE caso_asignaciones
       SET estado_servicio = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_asignacion = ?`,
      [estado, casos[0].id_asignacion]
    );

    await connection.query(
      `UPDATE casos
       SET estado = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_caso = ?`,
      [estado, id]
    );

    await connection.commit();

    return res.json({
      ok: true,
      message: 'Estado del caso actualizado correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en actualizarEstadoCasoAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar estado del caso'
    });
  } finally {
    connection.release();
  }
};

const solicitarDocumentosCasoAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { mensaje } = req.body;
    const id_abogado = await obtenerIdAbogadoPorUsuario(id_usuario);

    if (!id_abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El mensaje es obligatorio'
      });
    }

    const [conversaciones] = await pool.query(
      `SELECT id_conversacion
       FROM conversaciones
       WHERE id_caso = ?
         AND id_abogado = ?
       LIMIT 1`,
      [id, id_abogado]
    );

    if (conversaciones.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Este caso aún no tiene conversación activa'
      });
    }

    await pool.query(
      `INSERT INTO mensajes
      (id_conversacion, id_remitente, tipo_mensaje, mensaje, leido)
      VALUES (?, ?, 'sistema', ?, 0)`,
      [conversaciones[0].id_conversacion, id_usuario, mensaje.trim()]
    );

    const [clientesDestino] = await pool.query(
      `SELECT cl.id_usuario
       FROM conversaciones conv
       INNER JOIN clientes cl ON cl.id_cliente = conv.id_cliente
       WHERE conv.id_conversacion = ?
       LIMIT 1`,
      [conversaciones[0].id_conversacion]
    );

    if (clientesDestino.length > 0) {
      await crearNotificacion({
        id_usuario: clientesDestino[0].id_usuario,
        tipo_notificacion: 'caso',
        titulo: 'Solicitud de documentos',
        mensaje: `Tu abogado solicito documentos adicionales en el caso #${id}.`
      });
    }

    return res.json({
      ok: true,
      message: 'Solicitud de documentos enviada al cliente'
    });
  } catch (error) {
    console.error('Error en solicitarDocumentosCasoAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al solicitar documentos'
    });
  }
};

const agregarNotaPrivadaCasoAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { nota } = req.body;
    const id_abogado = await obtenerIdAbogadoPorUsuario(id_usuario);

    if (!id_abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    if (!nota || !nota.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'La nota es obligatoria'
      });
    }

    const [casos] = await pool.query(
      `SELECT 1
       FROM caso_asignaciones
       WHERE id_caso = ?
         AND id_abogado = ?
       LIMIT 1`,
      [id, id_abogado]
    );

    if (casos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO caso_notas_privadas
      (id_caso, id_abogado, nota)
      VALUES (?, ?, ?)`,
      [id, id_abogado, nota.trim()]
    );

    const [abogadosNotificar] = await pool.query(
      `SELECT DISTINCT a.id_usuario
       FROM abogados a
       INNER JOIN abogado_especialidad ae ON ae.id_abogado = a.id_abogado
       WHERE ae.id_especialidad = ?
         AND a.acepta_nuevos_casos = 1`,
      [id_especialidad]
    );

    await crearNotificacionesMasivas({
      usuarios: abogadosNotificar.map((item) => item.id_usuario),
      tipo_notificacion: 'caso',
      titulo: 'Nuevo caso disponible',
      mensaje: `Se publico el caso ${folio_caso}: ${titulo}.`
    });

    return res.status(201).json({
      ok: true,
      message: 'Nota privada guardada correctamente',
      data: {
        id_nota_privada: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en agregarNotaPrivadaCasoAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al guardar nota privada'
    });
  }
};

module.exports = {
  crearCaso,
  listarMisCasosCliente,
  obtenerMiCasoCliente,
  listarCasosDisponiblesAbogado,
  obtenerCasoDisponibleAbogado,
  postularmeACaso,
  asignarAbogadoACaso,
  listarMisCasosAbogado,
  obtenerMiCasoAbogado,
  actualizarEstadoCasoAbogado,
  solicitarDocumentosCasoAbogado,
  agregarNotaPrivadaCasoAbogado
};

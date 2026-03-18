const { pool } = require('../config/db');

const obtenerDashboardAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [abogados] = await pool.query(
      'SELECT id_abogado, total_ingresos FROM abogados WHERE id_usuario = ? LIMIT 1',
      [id_usuario]
    );

    if (abogados.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const abogado = abogados[0];
    const id_abogado = abogado.id_abogado;

    const [casosNuevosRows] = await pool.query(
      `SELECT COUNT(DISTINCT c.id_caso) AS total
       FROM casos c
       INNER JOIN abogado_especialidad ae ON ae.id_especialidad = c.id_especialidad
       WHERE ae.id_abogado = ?
         AND c.estado = 'publicado'
         AND NOT EXISTS (
           SELECT 1
           FROM caso_postulaciones cp
           WHERE cp.id_caso = c.id_caso
             AND cp.id_abogado = ?
         )`,
      [id_abogado, id_abogado]
    );

    const [casosAsignadosRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM caso_asignaciones ca
       INNER JOIN casos c ON c.id_caso = ca.id_caso
       WHERE ca.id_abogado = ?
         AND c.estado IN ('asignado', 'en_proceso')`,
      [id_abogado]
    );

    const [mensajesSinLeerRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM mensajes m
       INNER JOIN conversaciones conv ON conv.id_conversacion = m.id_conversacion
       WHERE conv.id_abogado = ?
         AND m.id_remitente <> ?
         AND m.leido = 0`,
      [id_abogado, id_usuario]
    );

    const [reunionesProximasRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM citas
       WHERE id_abogado = ?
         AND estado IN ('programada', 'confirmada', 'reprogramada')
         AND fecha_inicio >= NOW()`,
      [id_abogado]
    );

    const [documentosRecientesRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM documentos_generados
       WHERE id_abogado = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [id_abogado]
    );

    const [casosPendientesPagoRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM caso_asignaciones
       WHERE id_abogado = ?
         AND estado_servicio = 'pendiente_pago'`,
      [id_abogado]
    );

    const tareasPendientes = Number(casosPendientesPagoRows[0]?.total || 0)
      + Number(mensajesSinLeerRows[0]?.total || 0)
      + Number(reunionesProximasRows[0]?.total || 0);

    const [proximasReuniones] = await pool.query(
      `SELECT
        ci.id_cita,
        ci.id_caso,
        ci.titulo,
        ci.fecha_inicio,
        ci.fecha_fin,
        ci.modalidad,
        ci.link_reunion,
        ci.estado,
        c.folio_caso,
        c.titulo AS titulo_caso
      FROM citas ci
      INNER JOIN casos c ON c.id_caso = ci.id_caso
      WHERE ci.id_abogado = ?
        AND ci.estado IN ('programada', 'confirmada', 'reprogramada')
        AND ci.fecha_inicio >= NOW()
      ORDER BY ci.fecha_inicio ASC
      LIMIT 5`,
      [id_abogado]
    );

    const [documentosRecientes] = await pool.query(
      `SELECT
        id_documento_generado,
        id_caso,
        titulo_documento,
        formato_salida,
        estatus,
        created_at
      FROM documentos_generados
      WHERE id_abogado = ?
      ORDER BY id_documento_generado DESC
      LIMIT 5`,
      [id_abogado]
    );

    const [casosAsignadosDetalle] = await pool.query(
      `SELECT
        c.id_caso,
        c.folio_caso,
        c.titulo,
        c.estado,
        c.urgencia,
        c.created_at,
        ca.estado_servicio,
        ca.monto_acordado
      FROM caso_asignaciones ca
      INNER JOIN casos c ON c.id_caso = ca.id_caso
      WHERE ca.id_abogado = ?
        AND c.estado IN ('asignado', 'en_proceso')
      ORDER BY c.updated_at DESC
      LIMIT 5`,
      [id_abogado]
    );

    const [casosNuevosDetalle] = await pool.query(
      `SELECT DISTINCT
        c.id_caso,
        c.folio_caso,
        c.titulo,
        c.urgencia,
        c.presupuesto_min,
        c.presupuesto_max,
        c.ciudad,
        c.estado_republica,
        c.created_at
      FROM casos c
      INNER JOIN abogado_especialidad ae ON ae.id_especialidad = c.id_especialidad
      WHERE ae.id_abogado = ?
        AND c.estado = 'publicado'
        AND NOT EXISTS (
          SELECT 1
          FROM caso_postulaciones cp
          WHERE cp.id_caso = c.id_caso
            AND cp.id_abogado = ?
        )
      ORDER BY c.id_caso DESC
      LIMIT 5`,
      [id_abogado, id_abogado]
    );

    return res.json({
      ok: true,
      data: {
        resumen: {
          casos_nuevos: Number(casosNuevosRows[0]?.total || 0),
          casos_asignados: Number(casosAsignadosRows[0]?.total || 0),
          mensajes_sin_leer: Number(mensajesSinLeerRows[0]?.total || 0),
          reuniones_proximas: Number(reunionesProximasRows[0]?.total || 0),
          documentos_recientes: Number(documentosRecientesRows[0]?.total || 0),
          ingresos: Number(abogado.total_ingresos || 0),
          tareas_pendientes: tareasPendientes
        },
        casos_nuevos: casosNuevosDetalle,
        casos_asignados: casosAsignadosDetalle,
        proximas_reuniones: proximasReuniones,
        documentos_recientes: documentosRecientes,
        alertas: {
          casos_pendientes_pago: Number(casosPendientesPagoRows[0]?.total || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error en obtenerDashboardAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener dashboard del abogado'
    });
  }
};

const getMiPerfilAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [rows] = await pool.query(
      `SELECT
        a.id_abogado,
        a.id_usuario,
        a.cedula_profesional,
        a.cedula_verificada,
        a.universidad,
        a.nivel_academico,
        a.anos_experiencia,
        a.descripcion_profesional,
        a.biografia_corta,
        a.nombre_despacho,
        a.sitio_web,
        a.linkedin_url,
        a.idiomas,
        a.modalidad_atencion,
        a.consulta_gratuita,
        a.precio_consulta_base,
        a.moneda,
        a.estatus_verificacion,
        a.acepta_nuevos_casos,
        a.rating_promedio,
        a.total_resenas,
        a.total_casos,
        a.total_ingresos,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.telefono,
        u.foto_perfil,
        d.estado,
        d.ciudad
      FROM abogados a
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      LEFT JOIN direcciones d ON d.id_usuario = a.id_usuario
      WHERE a.id_usuario = ?
      LIMIT 1`,
      [id_usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Perfil de abogado no encontrado'
      });
    }

    const abogado = rows[0];

    const [especialidades] = await pool.query(
      `SELECT
        ae.id_abogado_especialidad,
        ae.id_especialidad,
        ae.principal,
        ae.anos_experiencia,
        ae.descripcion,
        e.nombre,
        e.slug
      FROM abogado_especialidad ae
      INNER JOIN especialidades e ON e.id_especialidad = ae.id_especialidad
      WHERE ae.id_abogado = ?`,
      [abogado.id_abogado]
    );

    abogado.especialidades = especialidades;

    return res.json({
      ok: true,
      data: abogado
    });
  } catch (error) {
    console.error('Error en getMiPerfilAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener perfil del abogado'
    });
  }
};

const actualizarMiPerfilAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const {
      cedula_profesional,
      universidad,
      nivel_academico,
      anos_experiencia,
      descripcion_profesional,
      biografia_corta,
      nombre_despacho,
      sitio_web,
      linkedin_url,
      idiomas,
      modalidad_atencion,
      consulta_gratuita,
      precio_consulta_base,
      moneda,
      acepta_nuevos_casos,
      estado,
      ciudad
    } = req.body;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
      `UPDATE abogados
       SET
         cedula_profesional = ?,
         universidad = ?,
         nivel_academico = ?,
         anos_experiencia = ?,
         descripcion_profesional = ?,
         biografia_corta = ?,
         nombre_despacho = ?,
         sitio_web = ?,
         linkedin_url = ?,
         idiomas = ?,
         modalidad_atencion = ?,
         consulta_gratuita = ?,
         precio_consulta_base = ?,
         moneda = ?,
         acepta_nuevos_casos = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_usuario = ?`,
      [
        cedula_profesional || null,
        universidad || null,
        nivel_academico || null,
        Number(anos_experiencia || 0),
        descripcion_profesional || null,
        biografia_corta || null,
        nombre_despacho || null,
        sitio_web || null,
        linkedin_url || null,
        idiomas || null,
        modalidad_atencion || 'ambas',
        consulta_gratuita ? 1 : 0,
        Number(precio_consulta_base || 0),
        moneda || 'MXN',
        acepta_nuevos_casos ? 1 : 0,
        id_usuario
      ]
    );

      const [direcciones] = await connection.query(
        'SELECT id_direccion FROM direcciones WHERE id_usuario = ? LIMIT 1',
        [id_usuario]
      );

      if (direcciones.length > 0) {
        await connection.query(
          `UPDATE direcciones
           SET estado = ?,
               ciudad = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id_direccion = ?`,
          [estado || null, ciudad || null, direcciones[0].id_direccion]
        );
      } else if (estado || ciudad) {
        await connection.query(
          `INSERT INTO direcciones
          (id_usuario, estado, ciudad, tipo_direccion)
          VALUES (?, ?, ?, 'personal')`,
          [id_usuario, estado || null, ciudad || null]
        );
      }

      await connection.commit();

      return res.json({
        ok: true,
        message: 'Perfil actualizado correctamente',
        affectedRows: result.affectedRows
      });
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en actualizarMiPerfilAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar perfil del abogado'
    });
  }
};

const subirFotoPerfilAbogado = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: 'Debes adjuntar una imagen'
      });
    }

    const rutaFoto = `/perfiles_abogados/${req.file.filename}`;

    await pool.query(
      `UPDATE usuarios
       SET foto_perfil = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_usuario = ?`,
      [rutaFoto, id_usuario]
    );

    return res.json({
      ok: true,
      message: 'Foto de perfil actualizada correctamente',
      data: {
        foto_perfil: rutaFoto
      }
    });
  } catch (error) {
    console.error('Error en subirFotoPerfilAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al subir foto de perfil'
    });
  }
};

const guardarEspecialidadesAbogado = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario } = req.user;
    const { especialidades } = req.body;

    if (!Array.isArray(especialidades) || especialidades.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Debes enviar un arreglo de especialidades'
      });
    }

    const [abogados] = await connection.query(
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

    await connection.beginTransaction();

    await connection.query(
      'DELETE FROM abogado_especialidad WHERE id_abogado = ?',
      [id_abogado]
    );

    for (const item of especialidades) {
      await connection.query(
        `INSERT INTO abogado_especialidad
        (id_abogado, id_especialidad, principal, anos_experiencia, descripcion)
        VALUES (?, ?, ?, ?, ?)`,
        [
          id_abogado,
          item.id_especialidad,
          item.principal ? 1 : 0,
          Number(item.anos_experiencia || 0),
          item.descripcion || null
        ]
      );
    }

    await connection.commit();

    return res.json({
      ok: true,
      message: 'Especialidades guardadas correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en guardarEspecialidadesAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al guardar especialidades'
    });
  } finally {
    connection.release();
  }
};

const listarAbogadosPublicos = async (req, res) => {
  try {
    const { especialidad, ciudad, modalidad } = req.query;

    let sql = `
      SELECT DISTINCT
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
        a.total_resenas
      FROM abogados a
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      LEFT JOIN abogado_especialidad ae ON ae.id_abogado = a.id_abogado
      LEFT JOIN direcciones d ON d.id_usuario = u.id_usuario
      WHERE u.estatus_cuenta = 'activo'
        AND a.estatus_verificacion = 'verificado'
        AND a.acepta_nuevos_casos = 1
    `;

    const params = [];

    if (especialidad) {
      sql += ` AND ae.id_especialidad = ?`;
      params.push(especialidad);
    }

    if (ciudad) {
      sql += ` AND d.ciudad = ?`;
      params.push(ciudad);
    }

    if (modalidad) {
      sql += ` AND a.modalidad_atencion = ?`;
      params.push(modalidad);
    }

    sql += ` ORDER BY a.rating_promedio DESC, a.total_resenas DESC, a.id_abogado DESC`;

    const [rows] = await pool.query(sql, params);

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarAbogadosPublicos:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar abogados'
    });
  }
};

const obtenerAbogadoPublicoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        a.id_abogado,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.telefono,
        u.foto_perfil,
        a.cedula_profesional,
        a.cedula_verificada,
        a.universidad,
        a.nivel_academico,
        a.anos_experiencia,
        a.descripcion_profesional,
        a.biografia_corta,
        a.nombre_despacho,
        a.sitio_web,
        a.linkedin_url,
        a.modalidad_atencion,
        a.consulta_gratuita,
        a.precio_consulta_base,
        a.moneda,
        a.rating_promedio,
        a.total_resenas,
        a.total_casos,
        a.acepta_nuevos_casos,
        (
          SELECT COUNT(*)
          FROM abogado_disponibilidad ad
          WHERE ad.id_abogado = a.id_abogado
            AND ad.activo = 1
        ) AS disponibilidad_activa,
        av.badge_verificado,
        av.estatus_general,
        d.estado,
        d.municipio,
        d.ciudad
      FROM abogados a
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      LEFT JOIN abogado_verificaciones av ON av.id_abogado = a.id_abogado
      LEFT JOIN direcciones d ON d.id_usuario = u.id_usuario
      WHERE a.id_abogado = ?
      LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const abogado = rows[0];
    abogado.badge_verificado = !!abogado.badge_verificado;
    abogado.cedula_verificada = !!abogado.cedula_verificada;
    abogado.estatus_verificacion = abogado.estatus_general || null;

    const [especialidades] = await pool.query(
      `SELECT
        e.id_especialidad,
        e.nombre,
        e.slug,
        ae.principal,
        ae.anos_experiencia,
        ae.descripcion
      FROM abogado_especialidad ae
      INNER JOIN especialidades e ON e.id_especialidad = ae.id_especialidad
      WHERE ae.id_abogado = ?`,
      [id]
    );

    abogado.especialidades = especialidades;

    const [tiempoRespuestaRows] = await pool.query(
      `SELECT
        AVG(
          TIMESTAMPDIFF(
            MINUTE,
            m_cliente.created_at,
            (
              SELECT MIN(m_abogado.created_at)
              FROM mensajes m_abogado
              WHERE m_abogado.id_conversacion = c.id_conversacion
                AND m_abogado.id_remitente = u.id_usuario
                AND m_abogado.created_at > m_cliente.created_at
            )
          )
        ) AS tiempo_respuesta_promedio_minutos
      FROM conversaciones c
      INNER JOIN mensajes m_cliente ON m_cliente.id_conversacion = c.id_conversacion
      INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
      INNER JOIN usuarios uc ON uc.id_usuario = cl.id_usuario
      INNER JOIN abogados a2 ON a2.id_abogado = c.id_abogado
      INNER JOIN usuarios u ON u.id_usuario = a2.id_usuario
      WHERE c.id_abogado = ?
        AND m_cliente.id_remitente = uc.id_usuario`,
      [id]
    );

    abogado.tiempo_respuesta_promedio_minutos = tiempoRespuestaRows[0]?.tiempo_respuesta_promedio_minutos !== null
      ? Number(tiempoRespuestaRows[0].tiempo_respuesta_promedio_minutos)
      : null;

    return res.json({
      ok: true,
      data: abogado
    });
  } catch (error) {
    console.error('Error en obtenerAbogadoPublicoPorId:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener abogado'
    });
  }
};

module.exports = {
  obtenerDashboardAbogado,
  getMiPerfilAbogado,
  actualizarMiPerfilAbogado,
  subirFotoPerfilAbogado,
  guardarEspecialidadesAbogado,
  listarAbogadosPublicos,
  obtenerAbogadoPublicoPorId
};

const { pool } = require('../config/db');

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
        u.foto_perfil
      FROM abogados a
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
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
      modalidad_atencion,
      consulta_gratuita,
      precio_consulta_base,
      moneda,
      acepta_nuevos_casos
    } = req.body;

    const [result] = await pool.query(
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
        modalidad_atencion || 'ambas',
        consulta_gratuita ? 1 : 0,
        Number(precio_consulta_base || 0),
        moneda || 'MXN',
        acepta_nuevos_casos ? 1 : 0,
        id_usuario
      ]
    );

    return res.json({
      ok: true,
      message: 'Perfil actualizado correctamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error en actualizarMiPerfilAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar perfil del abogado'
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
        d.estado,
        d.municipio,
        d.ciudad
      FROM abogados a
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
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
  getMiPerfilAbogado,
  actualizarMiPerfilAbogado,
  guardarEspecialidadesAbogado,
  listarAbogadosPublicos,
  obtenerAbogadoPublicoPorId
};
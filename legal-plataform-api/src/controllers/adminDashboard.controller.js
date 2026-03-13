const { pool } = require('../config/db');

const obtenerDashboardAdmin = async (req, res) => {
  try {
    const [
      usuariosPorRolRes,
      plantillasResumenRes,
      bloquesRes,
      maestrasRes,
      tiposRes,
      comprasRes,
      documentosRes,
      resenasRes,
      actividadRes
    ] = await Promise.all([
      pool.query(`
        SELECT
          r.nombre AS rol_nombre,
          COUNT(*) AS total
        FROM usuarios u
        INNER JOIN roles r ON r.id_role = u.id_role
        WHERE u.deleted_at IS NULL
        GROUP BY r.nombre
      `),

      pool.query(`
        SELECT
          COUNT(*) AS total_plantillas,
          SUM(CASE WHEN estatus_publicacion = 'publicada' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS publicadas,
          SUM(CASE WHEN estatus_publicacion = 'borrador' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS borradores,
          SUM(CASE WHEN estatus_publicacion = 'archivada' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS archivadas,
          SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS en_papelera
        FROM plantillas_legales
      `),

      pool.query(`
        SELECT
          COUNT(*) AS total_bloques,
          SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS en_papelera
        FROM plantilla_bloques_html
      `),

      pool.query(`
        SELECT
          COUNT(*) AS total_maestras,
          SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS en_papelera
        FROM plantilla_maestra_html
      `),

      pool.query(`
        SELECT
          COUNT(*) AS total_tipos_documento,
          SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS en_papelera
        FROM tipos_documento
      `),

      pool.query(`
        SELECT
          COUNT(*) AS total_compras,
          COALESCE(SUM(CASE WHEN estatus_pago = 'pagado' THEN monto_pagado ELSE 0 END), 0) AS ingresos_plantillas
        FROM compras_plantilla
      `),

      pool.query(`
        SELECT
          COUNT(*) AS total_documentos_generados
        FROM documentos_generados
      `),

      pool.query(`
        SELECT
          COUNT(*) AS total_resenas,
          COALESCE(AVG(calificacion), 0) AS promedio_calificacion
        FROM resenas
      `),

      pool.query(`
        SELECT
          b.id_bitacora,
          b.modulo,
          b.entidad,
          b.accion,
          b.descripcion,
          b.created_at,
          u.nombre,
          u.apellido_paterno,
          u.apellido_materno
        FROM admin_bitacora b
        INNER JOIN usuarios u ON u.id_usuario = b.id_usuario
        ORDER BY b.id_bitacora DESC
        LIMIT 15
      `)
    ]);

    const usuariosPorRol = usuariosPorRolRes[0] || [];
    const plantillasResumen = plantillasResumenRes[0][0] || {};
    const bloquesResumen = bloquesRes[0][0] || {};
    const maestrasResumen = maestrasRes[0][0] || {};
    const tiposResumen = tiposRes[0][0] || {};
    const comprasResumen = comprasRes[0][0] || {};
    const documentosResumen = documentosRes[0][0] || {};
    const resenasResumen = resenasRes[0][0] || {};
    const actividadReciente = actividadRes[0] || [];

    const totalAdmins =
      Number(
        usuariosPorRol.find((x) => String(x.rol_nombre).toLowerCase() === 'admin')?.total || 0
      );

    const totalAbogados =
      Number(
        usuariosPorRol.find((x) => String(x.rol_nombre).toLowerCase() === 'abogado')?.total || 0
      );

    const totalClientes =
      Number(
        usuariosPorRol.find((x) => String(x.rol_nombre).toLowerCase() === 'cliente')?.total || 0
      );

    return res.json({
      ok: true,
      data: {
        kpis: {
          total_admins: totalAdmins,
          total_abogados: totalAbogados,
          total_clientes: totalClientes,
          total_plantillas: Number(plantillasResumen.total_plantillas || 0),
          total_bloques: Number(bloquesResumen.total_bloques || 0),
          total_maestras: Number(maestrasResumen.total_maestras || 0),
          total_tipos_documento: Number(tiposResumen.total_tipos_documento || 0),
          total_compras: Number(comprasResumen.total_compras || 0),
          ingresos_plantillas: Number(comprasResumen.ingresos_plantillas || 0),
          total_documentos_generados: Number(documentosResumen.total_documentos_generados || 0),
          total_resenas: Number(resenasResumen.total_resenas || 0),
          promedio_calificacion: Number(resenasResumen.promedio_calificacion || 0)
        },
        plantillas: {
          publicadas: Number(plantillasResumen.publicadas || 0),
          borradores: Number(plantillasResumen.borradores || 0),
          archivadas: Number(plantillasResumen.archivadas || 0),
          en_papelera: Number(plantillasResumen.en_papelera || 0)
        },
        bloques: {
          en_papelera: Number(bloquesResumen.en_papelera || 0)
        },
        maestras: {
          en_papelera: Number(maestrasResumen.en_papelera || 0)
        },
        tipos_documento: {
          en_papelera: Number(tiposResumen.en_papelera || 0)
        },
        actividad_reciente: actividadReciente
      }
    });
  } catch (error) {
    console.error('Error en obtenerDashboardAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener dashboard admin'
    });
  }
};

module.exports = {
  obtenerDashboardAdmin
};
const { pool } = require('../config/db');

const {
  construirHtmlPreviewGenerico,
  construirHtmlPreviewEspecifico,
  construirHtmlPreviewPorBloques,
  construirHtmlDesdeBloques
} = require('../services/documentoPreview.service');

const previewDocumento = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { datos_capturados_json } = req.body;

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

    const [compras] = await pool.query(
      `SELECT id_compra_plantilla
       FROM compras_plantilla
       WHERE id_plantilla = ?
         AND id_abogado = ?
         AND estatus_pago = 'pagado'
       LIMIT 1`,
      [id, id_abogado]
    );

    if (compras.length === 0) {
      return res.status(403).json({
        ok: false,
        message: 'Debes comprar la plantilla antes de ver el preview'
      });
    }

    const [plantillas] = await pool.query(
      `SELECT
        id_plantilla,
        titulo,
        descripcion_larga
      FROM plantillas_legales
      WHERE id_plantilla = ?
      LIMIT 1`,
      [id]
    );

    if (plantillas.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Plantilla no encontrada'
      });
    }

    const plantilla = plantillas[0];

    const [versiones] = await pool.query(
      `SELECT
        id_version,
        html_preview_base,
        estructura_bloques_json
      FROM plantilla_versiones
      WHERE id_plantilla = ?
        AND es_actual = 1
      LIMIT 1`,
      [id]
    );

    const versionActual = versiones[0] || null;
    const datos = datos_capturados_json || {};

    let html;
    let usa_preview_especifico = false;
    let usa_bloques = false;

    let estructuraBloques = null;
    if (versionActual?.estructura_bloques_json) {
      try {
        estructuraBloques =
          typeof versionActual.estructura_bloques_json === 'string'
            ? JSON.parse(versionActual.estructura_bloques_json)
            : versionActual.estructura_bloques_json;
      } catch {
        estructuraBloques = null;
      }
    }

    if (estructuraBloques && Array.isArray(estructuraBloques) && estructuraBloques.length > 0) {
      html = construirHtmlPreviewPorBloques({
        plantilla,
        estructuraBloques,
        datos
      });
      usa_bloques = true;
    } else if (versionActual?.html_preview_base) {
      html = construirHtmlPreviewEspecifico({
        plantilla,
        htmlPreviewBase: versionActual.html_preview_base,
        datos
      });
      usa_preview_especifico = true;
    } else {
      html = construirHtmlPreviewGenerico({
        plantilla,
        datos
      });
    }

    return res.json({
      ok: true,
      data: {
        html,
        usa_preview_especifico,
        usa_bloques
      }
    });
  } catch (error) {
    console.error('Error en previewDocumento:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al generar preview'
    });
  }
};

const listarPlantillas = async (req, res) => {
  try {
    const { id_especialidad, categoria } = req.query;

    let sql = `
      SELECT
        p.id_plantilla,
        p.id_categoria_plantilla,
        p.id_especialidad,
        cp.nombre AS categoria,
        e.nombre AS especialidad,
        p.titulo,
        p.slug,
        p.descripcion_corta,
        p.precio,
        p.moneda,
        p.version_actual,
        p.tipo_archivo_salida,
        p.requiere_revision_manual,
        p.activo
      FROM plantillas_legales p
      INNER JOIN categorias_plantilla cp ON cp.id_categoria_plantilla = p.id_categoria_plantilla
      INNER JOIN especialidades e ON e.id_especialidad = p.id_especialidad
      WHERE p.activo = 1
        AND p.deleted_at IS NULL
        AND p.estatus_publicacion = 'publicada'
    `;

    const params = [];

    if (id_especialidad) {
      sql += ` AND p.id_especialidad = ?`;
      params.push(id_especialidad);
    }

    if (categoria) {
      sql += ` AND p.id_categoria_plantilla = ?`;
      params.push(categoria);
    }

    sql += ` ORDER BY p.id_plantilla DESC`;

    const [rows] = await pool.query(sql, params);

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarPlantillas:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar plantillas'
    });
  }
};

const obtenerPlantillaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        p.id_plantilla,
        p.id_categoria_plantilla,
        p.id_especialidad,
        cp.nombre AS categoria,
        e.nombre AS especialidad,
        p.titulo,
        p.slug,
        p.descripcion_corta,
        p.descripcion_larga,
        p.precio,
        p.moneda,
        p.version_actual,
        p.tipo_archivo_salida,
        p.requiere_revision_manual,
        p.activo
      FROM plantillas_legales p
      INNER JOIN categorias_plantilla cp ON cp.id_categoria_plantilla = p.id_categoria_plantilla
      INNER JOIN especialidades e ON e.id_especialidad = p.id_especialidad
      WHERE p.id_plantilla = ?
        AND p.activo = 1
        AND p.deleted_at IS NULL
        AND p.estatus_publicacion = 'publicada'
      LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Plantilla no encontrada'
      });
    }

    const plantilla = rows[0];

    const [variables] = await pool.query(
      `SELECT
        id_variable,
        nombre_variable,
        label_campo,
        tipo_campo,
        placeholder,
        ayuda,
        requerido,
        orden,
        configuracion_json
      FROM plantilla_variables
      WHERE id_plantilla = ?
      ORDER BY orden ASC, id_variable ASC`,
      [id]
    );

    plantilla.variables = variables;

    return res.json({
      ok: true,
      data: plantilla
    });
  } catch (error) {
    console.error('Error en obtenerPlantillaPorId:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener plantilla'
    });
  }
};

const comprarPlantilla = async (req, res) => {
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

    const [plantillas] = await pool.query(
      'SELECT id_plantilla, precio, moneda FROM plantillas_legales WHERE id_plantilla = ? AND activo = 1 LIMIT 1',
      [id]
    );

    if (plantillas.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Plantilla no encontrada'
      });
    }

    const plantilla = plantillas[0];

    const [compraExistente] = await pool.query(
      `SELECT id_compra_plantilla
       FROM compras_plantilla
       WHERE id_plantilla = ?
         AND id_abogado = ?
         AND estatus_pago = 'pagado'
       LIMIT 1`,
      [id, id_abogado]
    );

    if (compraExistente.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya compraste esta plantilla'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO compras_plantilla
      (id_plantilla, id_abogado, monto_pagado, moneda, estatus_pago, referencia_externa, fecha_pago)
      VALUES (?, ?, ?, ?, 'pagado', ?, NOW())`,
      [
        id,
        id_abogado,
        plantilla.precio,
        plantilla.moneda,
        `COMPRA-PLANTILLA-${Date.now()}`
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Plantilla comprada correctamente',
      data: {
        id_compra_plantilla: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en comprarPlantilla:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al comprar plantilla'
    });
  }
};

const {
  generarDocxDesdePlantilla,
  generarPdfDesdeDatos,
  generarPdfDesdeHtml
} = require('../services/documento.service');

const previewTemplateService = require('../services/previewTemplate.service');

const generarDocumento = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { titulo_documento, datos_capturados_json, formato_salida, id_caso } = req.body;

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

    const [compras] = await pool.query(
      `SELECT id_compra_plantilla
       FROM compras_plantilla
       WHERE id_plantilla = ?
         AND id_abogado = ?
         AND estatus_pago = 'pagado'
       LIMIT 1`,
      [id, id_abogado]
    );

    if (compras.length === 0) {
      return res.status(403).json({
        ok: false,
        message: 'Debes comprar la plantilla antes de generar documentos'
      });
    }

    const id_compra_plantilla = compras[0].id_compra_plantilla;

    const [plantillas] = await pool.query(
      `SELECT
        id_plantilla,
        titulo,
        descripcion_larga
      FROM plantillas_legales
      WHERE id_plantilla = ?
      LIMIT 1`,
      [id]
    );

    if (plantillas.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Plantilla no encontrada'
      });
    }

    const plantilla = plantillas[0];

    const [versiones] = await pool.query(
  `SELECT
    id_version,
    numero_version,
    contenido_base,
    ruta_archivo_base,
    html_preview_base,
    estructura_bloques_json
  FROM plantilla_versiones
  WHERE id_plantilla = ?
    AND es_actual = 1
  LIMIT 1`,
  [id]
);

    if (versiones.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'La plantilla no tiene una versión activa'
      });
    }

    const version = versiones[0];
    const tituloFinal = titulo_documento || 'Documento generado';
    const datos = datos_capturados_json || {};

    let generado;

    if ((formato_salida || 'pdf') === 'docx') {
      if (!version.ruta_archivo_base) {
        return res.status(400).json({
          ok: false,
          message: 'Esta plantilla no tiene archivo base DOCX configurado'
        });
      }

      generado = await generarDocxDesdePlantilla({
        rutaArchivoBase: version.ruta_archivo_base,
        tituloDocumento: tituloFinal,
        datos
      });
        } else {
      let htmlFinal;
      let estructuraBloques = null;

      if (version.estructura_bloques_json) {
        try {
          estructuraBloques =
            typeof version.estructura_bloques_json === 'string'
              ? JSON.parse(version.estructura_bloques_json)
              : version.estructura_bloques_json;
        } catch {
          estructuraBloques = null;
        }
      }

      if (estructuraBloques && Array.isArray(estructuraBloques) && estructuraBloques.length > 0) {
        const htmlInterno = construirHtmlDesdeBloques({
          estructuraBloques,
          datos
        });

        htmlFinal = previewTemplateService.envolverHtmlPreview(
          htmlInterno,
          plantilla.titulo || tituloFinal
        );
      } else if (version.html_preview_base) {
        const htmlInterno = previewTemplateService.reemplazarPlaceholders(
          version.html_preview_base,
          datos
        );

        htmlFinal = previewTemplateService.envolverHtmlPreview(
          htmlInterno,
          plantilla.titulo || tituloFinal
        );
      } else {
        htmlFinal = construirHtmlPreviewGenerico({
          plantilla,
          datos
        });
      }

      generado = await generarPdfDesdeHtml({
        tituloDocumento: tituloFinal,
        html: htmlFinal
      });
    }

    const [result] = await pool.query(
      `INSERT INTO documentos_generados
      (
        id_plantilla,
        id_compra_plantilla,
        id_abogado,
        id_caso,
        titulo_documento,
        datos_capturados_json,
        ruta_archivo_generado,
        formato_salida,
        estatus
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generado')`,
      [
        id,
        id_compra_plantilla,
        id_abogado,
        id_caso || null,
        tituloFinal,
        JSON.stringify(datos),
        generado.rutaRelativa,
        formato_salida || 'pdf'
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Documento generado correctamente',
      data: {
        id_documento_generado: result.insertId,
        ruta_archivo_generado: generado.rutaRelativa
      }
    });
  } catch (error) {
    console.error('Error en generarDocumento:', error);
    return res.status(500).json({
      ok: false,
      message: `Error al generar documento: ${error.message}`
    });
  }
};

const listarMisCompras = async (req, res) => {
  try {
    const { id_usuario } = req.user;

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
        cp.id_compra_plantilla,
        cp.monto_pagado,
        cp.moneda,
        cp.estatus_pago,
        cp.fecha_pago,
        p.id_plantilla,
        p.titulo,
        p.descripcion_corta
      FROM compras_plantilla cp
      INNER JOIN plantillas_legales p ON p.id_plantilla = cp.id_plantilla
      WHERE cp.id_abogado = ?
      ORDER BY cp.id_compra_plantilla DESC`,
      [id_abogado]
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisCompras:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener compras'
    });
  }
};

const listarMisDocumentos = async (req, res) => {
  try {
    const { id_usuario } = req.user;

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
        dg.id_documento_generado,
        dg.id_plantilla,
        dg.id_caso,
        dg.titulo_documento,
        dg.ruta_archivo_generado,
        dg.formato_salida,
        dg.estatus,
        dg.created_at,
        p.titulo AS plantilla_titulo
      FROM documentos_generados dg
      INNER JOIN plantillas_legales p ON p.id_plantilla = dg.id_plantilla
      WHERE dg.id_abogado = ?
      ORDER BY dg.id_documento_generado DESC`,
      [id_abogado]
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisDocumentos:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener documentos generados'
    });
  }
};

module.exports = {
  listarPlantillas,
  obtenerPlantillaPorId,
  comprarPlantilla,
  generarDocumento,
  listarMisCompras,
  listarMisDocumentos,
  previewDocumento
};

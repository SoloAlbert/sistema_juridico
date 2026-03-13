const { pool } = require('../config/db');

const listarCatalogosPlantillas = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      `SELECT id_categoria_plantilla, nombre, descripcion, activo
       FROM categorias_plantilla
       ORDER BY nombre ASC`
    );

    const [especialidades] = await pool.query(
      `SELECT id_especialidad, nombre, slug, activo
       FROM especialidades
       ORDER BY nombre ASC`
    );

    return res.json({
      ok: true,
      data: {
        categorias,
        especialidades
      }
    });
  } catch (error) {
    console.error('Error en listarCatalogosPlantillas:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener catálogos'
    });
  }
};

const listarPlantillasAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.id_plantilla,
        p.titulo,
        p.slug,
        p.precio,
        p.moneda,
        p.version_actual,
        p.tipo_archivo_salida,
        p.requiere_revision_manual,
        p.activo,
        cp.nombre AS categoria,
        e.nombre AS especialidad
      FROM plantillas_legales p
      INNER JOIN categorias_plantilla cp ON cp.id_categoria_plantilla = p.id_categoria_plantilla
      INNER JOIN especialidades e ON e.id_especialidad = p.id_especialidad
      ORDER BY p.id_plantilla DESC`
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarPlantillasAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar plantillas'
    });
  }
};

const obtenerPlantillaAdminPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [plantillas] = await pool.query(
      `SELECT
        p.*
      FROM plantillas_legales p
      WHERE p.id_plantilla = ?
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

    const [variables] = await pool.query(
      `SELECT
        id_variable,
        id_plantilla,
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

    const [versiones] = await pool.query(
  `SELECT
    id_version,
    id_plantilla,
    numero_version,
    contenido_base,
    ruta_archivo_base,
    html_preview_base,
    estructura_bloques_json,
    notas_cambios,
    es_actual,
    creado_por,
    created_at
  FROM plantilla_versiones
  WHERE id_plantilla = ?
  ORDER BY id_version DESC`,
  [id]
);

    plantilla.variables = variables;
    plantilla.versiones = versiones;

    return res.json({
      ok: true,
      data: plantilla
    });
  } catch (error) {
    console.error('Error en obtenerPlantillaAdminPorId:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener plantilla'
    });
  }
};

const crearPlantillaAdmin = async (req, res) => {
  try {
    const {
  id_categoria_plantilla,
  id_especialidad,
  id_tipo_documento,
  titulo,
  slug,
  descripcion_corta,
  descripcion_larga,
  precio,
  moneda,
  version_actual,
  tipo_archivo_salida,
  requiere_revision_manual,
  activo
} = req.body;

    if (!id_categoria_plantilla || !id_especialidad || !titulo || !slug) {
      return res.status(400).json({
        ok: false,
        message: 'id_categoria_plantilla, id_especialidad, titulo y slug son obligatorios'
      });
    }

    const [existente] = await pool.query(
      'SELECT id_plantilla FROM plantillas_legales WHERE slug = ? LIMIT 1',
      [slug]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe una plantilla con ese slug'
      });
    }

    const [result] = await pool.query(
  `INSERT INTO plantillas_legales
  (
    id_categoria_plantilla,
    id_especialidad,
    id_tipo_documento,
    titulo,
    slug,
    descripcion_corta,
    descripcion_larga,
    precio,
    moneda,
    version_actual,
    tipo_archivo_salida,
    requiere_revision_manual,
    activo
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    id_categoria_plantilla,
    id_especialidad,
    id_tipo_documento || null,
    titulo,
    slug,
    descripcion_corta || null,
    descripcion_larga || null,
    Number(precio || 0),
    moneda || 'MXN',
    version_actual || '1.0',
    tipo_archivo_salida || 'pdf',
    requiere_revision_manual ? 1 : 0,
    activo ? 1 : 0
  ]
);

    return res.status(201).json({
      ok: true,
      message: 'Plantilla creada correctamente',
      data: {
        id_plantilla: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en crearPlantillaAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear plantilla'
    });
  }
};

const actualizarPlantillaAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
  id_categoria_plantilla,
  id_especialidad,
  id_tipo_documento,
  titulo,
  slug,
  descripcion_corta,
  descripcion_larga,
  precio,
  moneda,
  version_actual,
  tipo_archivo_salida,
  requiere_revision_manual,
  activo
} = req.body;

    await pool.query(
  `UPDATE plantillas_legales
   SET
     id_categoria_plantilla = ?,
     id_especialidad = ?,
     id_tipo_documento = ?,
     titulo = ?,
     slug = ?,
     descripcion_corta = ?,
     descripcion_larga = ?,
     precio = ?,
     moneda = ?,
     version_actual = ?,
     tipo_archivo_salida = ?,
     requiere_revision_manual = ?,
     activo = ?,
     updated_at = CURRENT_TIMESTAMP
   WHERE id_plantilla = ?`,
  [
    id_categoria_plantilla,
    id_especialidad,
    id_tipo_documento || null,
    titulo,
    slug,
    descripcion_corta || null,
    descripcion_larga || null,
    Number(precio || 0),
    moneda || 'MXN',
    version_actual || '1.0',
    tipo_archivo_salida || 'pdf',
    requiere_revision_manual ? 1 : 0,
    activo ? 1 : 0,
    id
  ]
);

    return res.json({
      ok: true,
      message: 'Plantilla actualizada correctamente'
    });
  } catch (error) {
    console.error('Error en actualizarPlantillaAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar plantilla'
    });
  }
};

const guardarVariablesPlantillaAdmin = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { variables } = req.body;

    if (!Array.isArray(variables)) {
      return res.status(400).json({
        ok: false,
        message: 'Debes enviar un arreglo de variables'
      });
    }

    await connection.beginTransaction();

    await connection.query(
      'DELETE FROM plantilla_variables WHERE id_plantilla = ?',
      [id]
    );

    for (const item of variables) {
      await connection.query(
        `INSERT INTO plantilla_variables
        (
          id_plantilla,
          nombre_variable,
          label_campo,
          tipo_campo,
          placeholder,
          ayuda,
          requerido,
          orden,
          configuracion_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.nombre_variable,
          item.label_campo,
          item.tipo_campo || 'texto',
          item.placeholder || null,
          item.ayuda || null,
          item.requerido ? 1 : 0,
          Number(item.orden || 0),
          item.configuracion_json ? JSON.stringify(item.configuracion_json) : null
        ]
      );
    }

    await connection.commit();

    return res.json({
      ok: true,
      message: 'Variables guardadas correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en guardarVariablesPlantillaAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al guardar variables'
    });
  } finally {
    connection.release();
  }
};

const crearVersionPlantillaAdmin = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const {
      numero_version,
      contenido_base,
      ruta_archivo_base,
      html_preview_base,
      estructura_bloques_json,
      notas_cambios,
      es_actual
    } = req.body;

    if (!numero_version) {
      return res.status(400).json({
        ok: false,
        message: 'numero_version es obligatorio'
      });
    }

    if (es_actual) {
      await pool.query(
        `UPDATE plantilla_versiones
         SET es_actual = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_plantilla = ?`,
        [id]
      );

      await pool.query(
        `UPDATE plantillas_legales
         SET version_actual = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_plantilla = ?`,
        [numero_version, id]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO plantilla_versiones
      (
        id_plantilla,
        numero_version,
        contenido_base,
        ruta_archivo_base,
        html_preview_base,
        estructura_bloques_json,
        notas_cambios,
        es_actual,
        creado_por
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        numero_version,
        contenido_base || null,
        ruta_archivo_base || null,
        html_preview_base || null,
        estructura_bloques_json ? JSON.stringify(estructura_bloques_json) : null,
        notas_cambios || null,
        es_actual ? 1 : 0,
        id_usuario
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Versión creada correctamente',
      data: {
        id_version: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en crearVersionPlantillaAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear versión'
    });
  }
};

const subirArchivoBaseVersionAdmin = async (req, res) => {
  try {
    const { id, idVersion } = req.params;

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: 'Debes subir un archivo .docx'
      });
    }

    const [versiones] = await pool.query(
      `SELECT id_version, id_plantilla
       FROM plantilla_versiones
       WHERE id_version = ?
         AND id_plantilla = ?
       LIMIT 1`,
      [idVersion, id]
    );

    if (versiones.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Versión no encontrada para esta plantilla'
      });
    }

    const rutaRelativa = `/plantillas_base/${req.file.filename}`;

    await pool.query(
      `UPDATE plantilla_versiones
       SET ruta_archivo_base = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_version = ?`,
      [rutaRelativa, idVersion]
    );

    return res.json({
      ok: true,
      message: 'Archivo base subido correctamente',
      data: {
        ruta_archivo_base: rutaRelativa,
        nombre_archivo: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error en subirArchivoBaseVersionAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al subir archivo base'
    });
  }
};

module.exports = {
  listarCatalogosPlantillas,
  listarPlantillasAdmin,
  obtenerPlantillaAdminPorId,
  crearPlantillaAdmin,
  actualizarPlantillaAdmin,
  guardarVariablesPlantillaAdmin,
  crearVersionPlantillaAdmin,
  subirArchivoBaseVersionAdmin
};
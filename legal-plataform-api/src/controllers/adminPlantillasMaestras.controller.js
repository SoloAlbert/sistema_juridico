const { pool } = require('../config/db');
const { registrarBitacoraAdmin } = require('../services/adminBitacora.service');

const listarPlantillasMaestrasAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id_plantilla_maestra,
        nombre,
        slug,
        descripcion,
        categoria,
        estructura_bloques_json,
        activo,
        created_at,
        updated_at
      FROM plantilla_maestra_html
      WHERE deleted_at IS NULL
      ORDER BY id_plantilla_maestra DESC`
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarPlantillasMaestrasAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar plantillas maestras'
    });
  }
};

const obtenerPlantillaMaestraAdminPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        id_plantilla_maestra,
        nombre,
        slug,
        descripcion,
        categoria,
        estructura_bloques_json,
        activo,
        created_at,
        updated_at
      FROM plantilla_maestra_html
      WHERE id_plantilla_maestra = ?
        AND deleted_at IS NULL
      LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Plantilla maestra no encontrada'
      });
    }

    return res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en obtenerPlantillaMaestraAdminPorId:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener plantilla maestra'
    });
  }
};

const crearPlantillaMaestraAdmin = async (req, res) => {
  try {
    const {
      nombre,
      slug,
      descripcion,
      categoria,
      estructura_bloques_json,
      activo
    } = req.body;

    if (!nombre || !slug) {
      return res.status(400).json({
        ok: false,
        message: 'nombre y slug son obligatorios'
      });
    }

    const [existente] = await pool.query(
      'SELECT id_plantilla_maestra FROM plantilla_maestra_html WHERE slug = ? LIMIT 1',
      [slug]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe una plantilla maestra con ese slug'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO plantilla_maestra_html
      (nombre, slug, descripcion, categoria, estructura_bloques_json, activo)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        slug,
        descripcion || null,
        categoria || null,
        JSON.stringify(estructura_bloques_json || []),
        activo ? 1 : 0
      ]
    );

    await registrarBitacoraAdmin({
      id_usuario: req.user.id_usuario,
      modulo: 'plantillas_maestras',
      entidad: 'plantilla_maestra_html',
      id_entidad: result.insertId,
      accion: 'crear',
      descripcion: `Creó la plantilla maestra "${nombre}"`,
      datos_despues: {
        nombre,
        slug,
        categoria,
        activo
      },
      req
    });

    return res.status(201).json({
      ok: true,
      message: 'Plantilla maestra creada correctamente',
      data: {
        id_plantilla_maestra: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en crearPlantillaMaestraAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear plantilla maestra'
    });
  }
};

const actualizarPlantillaMaestraAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      slug,
      descripcion,
      categoria,
      estructura_bloques_json,
      activo
    } = req.body;

    const [antesRows] = await pool.query(
      `SELECT *
       FROM plantilla_maestra_html
       WHERE id_plantilla_maestra = ?
       LIMIT 1`,
      [id]
    );

    const antes = antesRows[0] || null;

    await pool.query(
      `UPDATE plantilla_maestra_html
       SET
         nombre = ?,
         slug = ?,
         descripcion = ?,
         categoria = ?,
         estructura_bloques_json = ?,
         activo = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_plantilla_maestra = ?`,
      [
        nombre,
        slug,
        descripcion || null,
        categoria || null,
        JSON.stringify(estructura_bloques_json || []),
        activo ? 1 : 0,
        id
      ]
    );

    await registrarBitacoraAdmin({
      id_usuario: req.user.id_usuario,
      modulo: 'plantillas_maestras',
      entidad: 'plantilla_maestra_html',
      id_entidad: id,
      accion: 'actualizar',
      descripcion: `Actualizó la plantilla maestra "${nombre}"`,
      datos_antes: antes,
      datos_despues: {
        nombre,
        slug,
        categoria,
        activo
      },
      req
    });

    return res.json({
      ok: true,
      message: 'Plantilla maestra actualizada correctamente'
    });
  } catch (error) {
    console.error('Error en actualizarPlantillaMaestraAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar plantilla maestra'
    });
  }
};

const clonarPlantillaMaestraAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        nombre,
        slug,
        descripcion,
        categoria,
        estructura_bloques_json,
        activo
      FROM plantilla_maestra_html
      WHERE id_plantilla_maestra = ?
      LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Plantilla maestra no encontrada'
      });
    }

    const original = rows[0];
    const nuevoSlug = `${original.slug}-copia-${Date.now()}`;

    const [result] = await pool.query(
      `INSERT INTO plantilla_maestra_html
      (nombre, slug, descripcion, categoria, estructura_bloques_json, activo)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `${original.nombre} (Copia)`,
        nuevoSlug,
        original.descripcion,
        original.categoria,
        original.estructura_bloques_json,
        original.activo
      ]
    );

    await registrarBitacoraAdmin({
      id_usuario: req.user.id_usuario,
      modulo: 'plantillas_maestras',
      entidad: 'plantilla_maestra_html',
      id_entidad: result.insertId,
      accion: 'clonar',
      descripcion: `Clonó la plantilla maestra "${original.nombre}"`,
      datos_antes: {
        slug_origen: original.slug
      },
      datos_despues: {
        nombre: `${original.nombre} (Copia)`,
        slug: nuevoSlug
      },
      req
    });

    return res.status(201).json({
      ok: true,
      message: 'Plantilla maestra clonada correctamente',
      data: {
        id_plantilla_maestra: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en clonarPlantillaMaestraAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al clonar plantilla maestra'
    });
  }
};

module.exports = {
  listarPlantillasMaestrasAdmin,
  obtenerPlantillaMaestraAdminPorId,
  crearPlantillaMaestraAdmin,
  actualizarPlantillaMaestraAdmin,
  clonarPlantillaMaestraAdmin
};

const { pool } = require('../config/db');

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

module.exports = {
  listarPlantillasMaestrasAdmin,
  obtenerPlantillaMaestraAdminPorId,
  crearPlantillaMaestraAdmin,
  actualizarPlantillaMaestraAdmin
};
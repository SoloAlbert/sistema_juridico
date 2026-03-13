const { pool } = require('../config/db');

const listarBloquesHtmlAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id_bloque,
        nombre,
        slug,
        descripcion,
        categoria,
        html_base,
        activo,
        created_at,
        updated_at
      FROM plantilla_bloques_html
      ORDER BY id_bloque DESC`
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarBloquesHtmlAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar bloques HTML'
    });
  }
};

const obtenerBloqueHtmlAdminPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        id_bloque,
        nombre,
        slug,
        descripcion,
        categoria,
        html_base,
        activo,
        created_at,
        updated_at
      FROM plantilla_bloques_html
      WHERE id_bloque = ?
      LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Bloque no encontrado'
      });
    }

    return res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en obtenerBloqueHtmlAdminPorId:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener bloque HTML'
    });
  }
};

const crearBloqueHtmlAdmin = async (req, res) => {
  try {
    const { nombre, slug, descripcion, categoria, html_base, activo } = req.body;

    if (!nombre || !slug || !html_base) {
      return res.status(400).json({
        ok: false,
        message: 'nombre, slug y html_base son obligatorios'
      });
    }

    const [existente] = await pool.query(
      'SELECT id_bloque FROM plantilla_bloques_html WHERE slug = ? LIMIT 1',
      [slug]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe un bloque con ese slug'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO plantilla_bloques_html
      (nombre, slug, descripcion, categoria, html_base, activo)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        slug,
        descripcion || null,
        categoria || null,
        html_base,
        activo ? 1 : 0
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Bloque creado correctamente',
      data: {
        id_bloque: result.insertId
      }
    });
  } catch (error) {
    console.error('Error en crearBloqueHtmlAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear bloque HTML'
    });
  }
};

const actualizarBloqueHtmlAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, slug, descripcion, categoria, html_base, activo } = req.body;

    await pool.query(
      `UPDATE plantilla_bloques_html
       SET
         nombre = ?,
         slug = ?,
         descripcion = ?,
         categoria = ?,
         html_base = ?,
         activo = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_bloque = ?`,
      [
        nombre,
        slug,
        descripcion || null,
        categoria || null,
        html_base,
        activo ? 1 : 0,
        id
      ]
    );

    return res.json({
      ok: true,
      message: 'Bloque actualizado correctamente'
    });
  } catch (error) {
    console.error('Error en actualizarBloqueHtmlAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar bloque HTML'
    });
  }
};

module.exports = {
  listarBloquesHtmlAdmin,
  obtenerBloqueHtmlAdminPorId,
  crearBloqueHtmlAdmin,
  actualizarBloqueHtmlAdmin
};
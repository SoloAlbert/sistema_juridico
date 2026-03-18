const { pool } = require('../config/db');
const { crearCaso } = require('./casos.controller');

const obtenerClienteDesdeUsuario = async (id_usuario) => {
  const [clientes] = await pool.query(
    'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
    [id_usuario]
  );

  return clientes[0] || null;
};

const validarCasoDelCliente = async (id_caso, id_cliente) => {
  const [casos] = await pool.query(
    `SELECT id_caso, id_cliente
     FROM casos
     WHERE id_caso = ?
       AND id_cliente = ?
     LIMIT 1`,
    [id_caso, id_cliente]
  );

  return casos[0] || null;
};

const subirArchivosCasoCliente = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const descripcion = req.body.descripcion || null;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Debes subir al menos un archivo'
      });
    }

    const cliente = await obtenerClienteDesdeUsuario(id_usuario);

    if (!cliente) {
      return res.status(404).json({
        ok: false,
        message: 'Cliente no encontrado'
      });
    }

    const caso = await validarCasoDelCliente(id, cliente.id_cliente);

    if (!caso) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado para este cliente'
      });
    }

    const archivosGuardados = [];

    for (const file of req.files) {
      const rutaRelativa = `/casos_archivos/${file.filename}`;

      const [result] = await pool.query(
        `INSERT INTO caso_archivos
        (
          id_caso,
          subido_por,
          nombre_archivo,
          ruta_archivo,
          mime_type,
          tamano_bytes,
          descripcion,
          visible_para_cliente,
          visible_para_abogado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          id,
          id_usuario,
          file.originalname,
          rutaRelativa,
          file.mimetype || null,
          file.size || null,
          descripcion
        ]
      );

      archivosGuardados.push({
        id_archivo: result.insertId,
        nombre_archivo: file.originalname,
        ruta_archivo: rutaRelativa,
        mime_type: file.mimetype || null,
        tamano_bytes: file.size || 0
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'Archivos subidos correctamente',
      data: archivosGuardados
    });
  } catch (error) {
    console.error('Error en subirArchivosCasoCliente:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al subir archivos del caso'
    });
  }
};

const listarArchivosCasoCliente = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;

    const cliente = await obtenerClienteDesdeUsuario(id_usuario);

    if (!cliente) {
      return res.status(404).json({
        ok: false,
        message: 'Cliente no encontrado'
      });
    }

    const caso = await validarCasoDelCliente(id, cliente.id_cliente);

    if (!caso) {
      return res.status(404).json({
        ok: false,
        message: 'Caso no encontrado para este cliente'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id_archivo,
        id_caso,
        subido_por,
        nombre_archivo,
        ruta_archivo,
        mime_type,
        tamano_bytes,
        descripcion,
        visible_para_cliente,
        visible_para_abogado,
        created_at
      FROM caso_archivos
      WHERE id_caso = ?
        AND visible_para_cliente = 1
      ORDER BY id_archivo DESC`,
      [id]
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarArchivosCasoCliente:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar archivos del caso'
    });
  }
};

module.exports = {
  crearCasoCliente: crearCaso,
  subirArchivosCasoCliente,
  listarArchivosCasoCliente
};

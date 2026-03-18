const { pool } = require('../config/db');

const obtenerResumenPagoCaso = async (req, res) => {
  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;

    let filtroUsuario = '';
    let params = [id];

    if (role === 'cliente') {
      filtroUsuario = `
        AND c.id_cliente = (
          SELECT id_cliente FROM clientes WHERE id_usuario = ?
        )
      `;
      params.push(id_usuario);
    } else if (role === 'abogado') {
      filtroUsuario = `
        AND ca.id_abogado = (
          SELECT id_abogado FROM abogados WHERE id_usuario = ?
        )
      `;
      params.push(id_usuario);
    } else {
      return res.status(403).json({
        ok: false,
        message: 'Acceso no permitido'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        c.id_caso,
        c.folio_caso,
        c.titulo,
        c.estado,
        ca.id_asignacion,
        ca.id_abogado,
        ca.monto_acordado,
        ca.porcentaje_comision,
        ca.monto_comision,
        ca.monto_neto_abogado,
        ca.estado_servicio,
        a.nombre_despacho,
        u.nombre AS abogado_nombre,
        u.apellido_paterno AS abogado_apellido_paterno,
        u.apellido_materno AS abogado_apellido_materno
      FROM casos c
      INNER JOIN caso_asignaciones ca ON ca.id_caso = c.id_caso
      INNER JOIN abogados a ON a.id_abogado = ca.id_abogado
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      WHERE c.id_caso = ?
      ${filtroUsuario}
      LIMIT 1`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Asignación de pago no encontrada'
      });
    }

    return res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en obtenerResumenPagoCaso:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener resumen de pago'
    });
  }
};

const registrarPagoCaso = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_usuario } = req.user;
    const { id } = req.params;
    const { id_metodo_pago, referencia_externa } = req.body;

    if (!id_metodo_pago) {
      return res.status(400).json({
        ok: false,
        message: 'id_metodo_pago es obligatorio'
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

    const [asignaciones] = await connection.query(
      `SELECT
        c.id_caso,
        c.estado AS estado_caso,
        ca.id_asignacion,
        ca.id_abogado,
        ca.monto_acordado,
        ca.porcentaje_comision,
        ca.monto_comision,
        ca.monto_neto_abogado,
        ca.estado_servicio
      FROM casos c
      INNER JOIN caso_asignaciones ca ON ca.id_caso = c.id_caso
      WHERE c.id_caso = ?
        AND c.id_cliente = ?
      LIMIT 1`,
      [id, id_cliente]
    );

    if (asignaciones.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Caso asignado no encontrado'
      });
    }

    const asignacion = asignaciones[0];

    if (asignacion.estado_servicio !== 'pendiente_pago') {
      return res.status(400).json({
        ok: false,
        message: 'Este caso no está pendiente de pago'
      });
    }

    const [metodos] = await connection.query(
      'SELECT id_metodo_pago FROM metodos_pago WHERE id_metodo_pago = ? AND activo = 1 LIMIT 1',
      [id_metodo_pago]
    );

    if (metodos.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Método de pago inválido'
      });
    }

    const [pagosExistentes] = await connection.query(
      `SELECT id_pago
       FROM pagos
       WHERE id_asignacion = ?
         AND estatus_pago IN ('pagado', 'pendiente', 'retenido')
       LIMIT 1`,
      [asignacion.id_asignacion]
    );

    if (pagosExistentes.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe un pago registrado para esta asignación'
      });
    }

    await connection.beginTransaction();

    const [resultPago] = await connection.query(
      `INSERT INTO pagos
      (
        id_caso,
        id_asignacion,
        id_cliente,
        id_abogado,
        id_metodo_pago,
        referencia_externa,
        monto_bruto,
        porcentaje_comision,
        monto_comision,
        monto_neto_abogado,
        moneda,
        estatus_pago,
        fecha_pago
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MXN', 'pagado', NOW())`,
      [
        asignacion.id_caso,
        asignacion.id_asignacion,
        id_cliente,
        asignacion.id_abogado,
        id_metodo_pago,
        referencia_externa || null,
        asignacion.monto_acordado,
        asignacion.porcentaje_comision,
        asignacion.monto_comision,
        asignacion.monto_neto_abogado
      ]
    );

    const id_pago = resultPago.insertId;

    await connection.query(
      `INSERT INTO comisiones
      (
        id_pago,
        id_abogado,
        id_caso,
        porcentaje,
        monto,
        estatus
      )
      VALUES (?, ?, ?, ?, ?, 'cobrada')`,
      [
        id_pago,
        asignacion.id_abogado,
        asignacion.id_caso,
        asignacion.porcentaje_comision,
        asignacion.monto_comision
      ]
    );

    await connection.query(
      `INSERT INTO movimientos_financieros
      (tipo_movimiento, id_pago, id_usuario, monto, descripcion)
      VALUES
      ('ingreso_cliente', ?, ?, ?, ?)`,
      [
        id_pago,
        id_usuario,
        asignacion.monto_acordado,
        `Pago recibido del cliente para caso #${asignacion.id_caso}`
      ]
    );

    await connection.query(
      `INSERT INTO movimientos_financieros
      (tipo_movimiento, id_pago, monto, descripcion)
      VALUES
      ('comision_plataforma', ?, ?, ?)`,
      [
        id_pago,
        asignacion.monto_comision,
        `Comisión generada por caso #${asignacion.id_caso}`
      ]
    );

    await connection.query(
      `UPDATE caso_asignaciones
       SET estado_servicio = 'pagado',
           updated_at = CURRENT_TIMESTAMP
       WHERE id_asignacion = ?`,
      [asignacion.id_asignacion]
    );

    await connection.query(
      `UPDATE casos
       SET estado = 'en_proceso',
           updated_at = CURRENT_TIMESTAMP
       WHERE id_caso = ?`,
      [asignacion.id_caso]
    );

    await connection.query(
      `UPDATE abogados
       SET total_ingresos = total_ingresos + ?
       WHERE id_abogado = ?`,
      [asignacion.monto_neto_abogado, asignacion.id_abogado]
    );

    const [existeConversacion] = await connection.query(
      'SELECT id_conversacion FROM conversaciones WHERE id_caso = ? LIMIT 1',
      [asignacion.id_caso]
    );

    if (existeConversacion.length === 0) {
      await connection.query(
        `INSERT INTO conversaciones
        (id_caso, id_cliente, id_abogado, estado)
        VALUES (?, ?, ?, 'activa')`,
        [asignacion.id_caso, id_cliente, asignacion.id_abogado]
      );
    }

    await connection.commit();

    return res.status(201).json({
      ok: true,
      message: 'Pago registrado correctamente',
      data: {
        id_pago,
        id_caso: asignacion.id_caso,
        monto_bruto: asignacion.monto_acordado,
        porcentaje_comision: asignacion.porcentaje_comision,
        monto_comision: asignacion.monto_comision,
        monto_neto_abogado: asignacion.monto_neto_abogado
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en registrarPagoCaso:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al registrar pago'
    });
  } finally {
    connection.release();
  }
};

const listarMisPagosCliente = async (req, res) => {
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
        p.id_pago,
        p.id_caso,
        c.folio_caso,
        c.titulo,
        p.monto_bruto,
        p.porcentaje_comision,
        p.monto_comision,
        p.monto_neto_abogado,
        p.moneda,
        p.estatus_pago,
        p.fecha_pago,
        mp.nombre AS metodo_pago
      FROM pagos p
      INNER JOIN casos c ON c.id_caso = p.id_caso
      INNER JOIN metodos_pago mp ON mp.id_metodo_pago = p.id_metodo_pago
      WHERE p.id_cliente = ?
      ORDER BY p.id_pago DESC`,
      [id_cliente]
    );

    return res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisPagosCliente:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener pagos del cliente'
    });
  }
};

const listarMisIngresosAbogado = async (req, res) => {
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
        p.id_pago,
        p.id_caso,
        c.folio_caso,
        c.titulo,
        p.monto_bruto,
        p.porcentaje_comision,
        p.monto_comision,
        p.monto_neto_abogado,
        p.moneda,
        p.estatus_pago,
        p.fecha_pago
      FROM pagos p
      INNER JOIN casos c ON c.id_caso = p.id_caso
      WHERE p.id_abogado = ?
      ORDER BY p.id_pago DESC`,
      [id_abogado]
    );

    const [resumen] = await pool.query(
      `SELECT
        COUNT(*) AS total_pagos,
        IFNULL(SUM(CASE WHEN estatus_pago = 'pagado' THEN monto_bruto ELSE 0 END), 0) AS total_facturado,
        IFNULL(SUM(CASE WHEN estatus_pago = 'pagado' THEN monto_comision ELSE 0 END), 0) AS total_comisiones,
        IFNULL(SUM(CASE WHEN estatus_pago = 'pagado' THEN monto_neto_abogado ELSE 0 END), 0) AS total_neto,
        IFNULL(SUM(CASE WHEN estatus_pago IN ('pendiente', 'retenido') THEN monto_neto_abogado ELSE 0 END), 0) AS saldo_pendiente,
        IFNULL(SUM(CASE WHEN estatus_pago = 'retenido' THEN monto_neto_abogado ELSE 0 END), 0) AS total_retenido
      FROM pagos
      WHERE id_abogado = ?`,
      [id_abogado]
    );

    return res.json({
      ok: true,
      resumen: resumen[0],
      data: rows
    });
  } catch (error) {
    console.error('Error en listarMisIngresosAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener ingresos del abogado'
    });
  }
};

module.exports = {
  obtenerResumenPagoCaso,
  registrarPagoCaso,
  listarMisPagosCliente,
  listarMisIngresosAbogado
};

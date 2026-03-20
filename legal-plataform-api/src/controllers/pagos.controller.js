const { pool } = require('../config/db');
const { crearNotificacion } = require('../services/notificaciones.service');
const {
  crearPreferenciaMercadoPago,
  crearPreferenciaMercadoPagoConToken,
  obtenerPagoMercadoPago
} = require('../services/mercadoPago.service');
const { decryptText } = require('../services/mercadoPagoMarketplace.service');

const MP_METODO_PAGO_ID = 3;

function obtenerBaseUrlBackend(req) {
  return process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
}

function obtenerBaseUrlFrontend() {
  return (process.env.APP_URL || '').replace(/\/+$/, '');
}

async function obtenerCuentaMercadoPagoAbogado(idAbogado, connection = pool) {
  const [rows] = await connection.query(
    `SELECT
      id_abogado_pasarela_cuenta,
      mp_user_id,
      collector_id,
      public_key,
      access_token_enc,
      refresh_token_enc,
      scope,
      live_mode,
      estado_conexion
    FROM abogado_pasarela_cuentas
    WHERE id_abogado = ?
      AND proveedor = 'mercado_pago'
    LIMIT 1`,
    [idAbogado]
  );

  return rows[0] || null;
}

async function obtenerContextoPagoCaso(connection, { idCaso, idUsuario, role }) {
  let filtroUsuario = '';
  let params = [idCaso];

  if (role === 'cliente') {
    filtroUsuario = `
      AND c.id_cliente = (
        SELECT id_cliente FROM clientes WHERE id_usuario = ?
      )
    `;
    params.push(idUsuario);
  } else if (role === 'abogado') {
    filtroUsuario = `
      AND ca.id_abogado = (
        SELECT id_abogado FROM abogados WHERE id_usuario = ?
      )
    `;
    params.push(idUsuario);
  } else {
    return null;
  }

  const [rows] = await connection.query(
    `SELECT
      c.id_caso,
      c.id_cliente,
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
      a.id_usuario AS id_usuario_abogado,
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

  return rows[0] || null;
}

async function registrarPagoAprobado(connection, asignacion, referenciaExterna) {
  const [pagosExistentes] = await connection.query(
    `SELECT id_pago
     FROM pagos
     WHERE id_asignacion = ?
       AND estatus_pago = 'pagado'
     LIMIT 1`,
    [asignacion.id_asignacion]
  );

  if (pagosExistentes.length > 0) {
    return { id_pago: pagosExistentes[0].id_pago, duplicado: true };
  }

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
      asignacion.id_cliente,
      asignacion.id_abogado,
      MP_METODO_PAGO_ID,
      referenciaExterna || null,
      asignacion.monto_acordado,
      asignacion.porcentaje_comision,
      asignacion.monto_comision,
      asignacion.monto_neto_abogado
    ]
  );

  const idPago = resultPago.insertId;

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
      idPago,
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
      idPago,
      asignacion.id_cliente_usuario || null,
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
      idPago,
      asignacion.monto_comision,
      `Comision generada por caso #${asignacion.id_caso}`
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
      [asignacion.id_caso, asignacion.id_cliente, asignacion.id_abogado]
    );
  }

  if (asignacion.id_usuario_abogado) {
    await crearNotificacion({
      id_usuario: asignacion.id_usuario_abogado,
      tipo_notificacion: 'pago',
      titulo: 'Pago recibido',
      mensaje: `Recibiste un pago por ${asignacion.monto_neto_abogado} MXN en el caso #${asignacion.id_caso}.`,
      connection
    });
  }

  return { id_pago: idPago, duplicado: false };
}

const obtenerResumenPagoCaso = async (req, res) => {
  try {
    const { id_usuario, role } = req.user;
    const { id } = req.params;

    const contexto = await obtenerContextoPagoCaso(pool, {
      idCaso: id,
      idUsuario: id_usuario,
      role
    });

    if (!contexto) {
      return res.status(404).json({
        ok: false,
        message: 'Asignacion de pago no encontrada'
      });
    }

    return res.json({
      ok: true,
      data: contexto
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
  try {
    const { id_usuario } = req.user;
    const { id } = req.params;

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

    const idCliente = clientes[0].id_cliente;

    const [asignaciones] = await pool.query(
      `SELECT
        c.id_caso,
        c.id_cliente,
        c.folio_caso,
        c.titulo,
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
      [id, idCliente]
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
        message: 'Este caso no esta pendiente de pago'
      });
    }

    const [metodos] = await pool.query(
      'SELECT id_metodo_pago FROM metodos_pago WHERE id_metodo_pago = ? AND activo = 1 LIMIT 1',
      [MP_METODO_PAGO_ID]
    );

    if (metodos.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Metodo de pago Mercado Pago no configurado'
      });
    }

    const [pagosExistentes] = await pool.query(
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
        message: 'Ya existe un pago registrado para esta asignacion'
      });
    }

    const frontendBaseUrl = obtenerBaseUrlFrontend();

    if (!frontendBaseUrl) {
      return res.status(500).json({
        ok: false,
        message: 'Falta configurar APP_URL para redirigir al checkout'
      });
    }

    const backendBaseUrl = obtenerBaseUrlBackend(req);
    const externalReference = `${asignacion.id_asignacion}:${asignacion.id_caso}:${idCliente}`;

    const cuentaMarketplace = await obtenerCuentaMercadoPagoAbogado(asignacion.id_abogado);
    const esMarketplace = cuentaMarketplace?.estado_conexion === 'conectada' && cuentaMarketplace?.access_token_enc;

    const payloadPreferencia = {
      items: [
        {
          id: String(asignacion.id_caso),
          title: `Caso ${asignacion.folio_caso} - ${asignacion.titulo}`,
          description: `Pago del caso legal #${asignacion.folio_caso}`,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: Number(asignacion.monto_acordado)
        }
      ],
      external_reference: externalReference,
      notification_url: `${backendBaseUrl}/api/pagos/mercadopago/webhook`,
      back_urls: {
        success: `${frontendBaseUrl}/cliente/mis-casos/${id}/pago?mp_status=success`,
        failure: `${frontendBaseUrl}/cliente/mis-casos/${id}/pago?mp_status=failure`,
        pending: `${frontendBaseUrl}/cliente/mis-casos/${id}/pago?mp_status=pending`
      },
      metadata: {
        id_caso: asignacion.id_caso,
        id_asignacion: asignacion.id_asignacion,
        id_cliente: idCliente,
        id_abogado: asignacion.id_abogado
      }
    };

    if (esMarketplace) {
      payloadPreferencia.marketplace_fee = Number(asignacion.monto_comision);
    }

    const preferencia = esMarketplace
      ? await crearPreferenciaMercadoPagoConToken(
        payloadPreferencia,
        decryptText(cuentaMarketplace.access_token_enc)
      )
      : await crearPreferenciaMercadoPago(payloadPreferencia);

    return res.status(201).json({
      ok: true,
      message: 'Preferencia de pago creada correctamente',
      data: {
        init_point: preferencia.init_point,
        sandbox_init_point: preferencia.sandbox_init_point,
        preference_id: preferencia.id,
        modo_marketplace: esMarketplace
      }
    });
  } catch (error) {
    console.error('Error en registrarPagoCaso:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al iniciar pago con Mercado Pago'
    });
  }
};

const webhookMercadoPago = async (req, res) => {
  try {
    const tipo = req.query.type || req.body?.type;
    const dataId = req.query['data.id'] || req.body?.data?.id;
    const userId = Number(req.query.user_id || req.body?.user_id || 0);

    if (tipo !== 'payment' || !dataId) {
      return res.status(200).json({ ok: true });
    }

    let sellerAccessToken = null;
    let idAbogadoEvento = null;

    if (userId) {
      const [cuentas] = await pool.query(
        `SELECT id_abogado, access_token_enc
         FROM abogado_pasarela_cuentas
         WHERE proveedor = 'mercado_pago'
           AND mp_user_id = ?
         LIMIT 1`,
        [userId]
      );

      if (cuentas.length > 0) {
        sellerAccessToken = decryptText(cuentas[0].access_token_enc);
        idAbogadoEvento = cuentas[0].id_abogado;
      }
    }

    await pool.query(
      `INSERT INTO abogado_pasarela_eventos
      (id_abogado, proveedor, tipo_evento, referencia_externa, payload_json, procesado)
      VALUES (?, 'mercado_pago', 'webhook_payment', ?, ?, 0)`,
      [
        idAbogadoEvento,
        String(dataId),
        JSON.stringify({
          query: req.query,
          body: req.body
        })
      ]
    );

    const pagoMp = await obtenerPagoMercadoPago(dataId, sellerAccessToken || undefined);

    if (pagoMp.status !== 'approved') {
      return res.status(200).json({ ok: true });
    }

    const referencia = String(
      pagoMp.external_reference ||
      `${pagoMp.metadata?.id_asignacion || ''}:${pagoMp.metadata?.id_caso || ''}:${pagoMp.metadata?.id_cliente || ''}`
    );

    const [idAsignacion, idCaso, idCliente] = referencia.split(':').map((item) => Number(item));

    if (!idAsignacion || !idCaso || !idCliente) {
      return res.status(400).json({
        ok: false,
        message: 'Referencia externa invalida en webhook'
      });
    }

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query(
        `SELECT
          c.id_caso,
          c.id_cliente,
          cli.id_usuario AS id_cliente_usuario,
          ca.id_asignacion,
          ca.id_abogado,
          a.id_usuario AS id_usuario_abogado,
          ca.monto_acordado,
          ca.porcentaje_comision,
          ca.monto_comision,
          ca.monto_neto_abogado,
          ca.estado_servicio
        FROM casos c
        INNER JOIN caso_asignaciones ca ON ca.id_caso = c.id_caso
        INNER JOIN clientes cli ON cli.id_cliente = c.id_cliente
        INNER JOIN abogados a ON a.id_abogado = ca.id_abogado
        WHERE ca.id_asignacion = ?
          AND c.id_caso = ?
          AND c.id_cliente = ?
        LIMIT 1`,
        [idAsignacion, idCaso, idCliente]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Asignacion de pago no encontrada para webhook'
        });
      }

      await connection.beginTransaction();
      const resultadoPago = await registrarPagoAprobado(connection, rows[0], String(pagoMp.id));
      const montoFeeProvider = Array.isArray(pagoMp.fee_details)
        ? pagoMp.fee_details.reduce((acc, item) => acc + Number(item.amount || 0), 0)
        : 0;
      const montoNetoVendedor = Number(
        pagoMp.transaction_details?.net_received_amount || rows[0].monto_neto_abogado || 0
      );

      await connection.query(
        `INSERT INTO pagos_conciliacion
        (
          id_pago,
          proveedor,
          provider_payment_id,
          provider_status,
          monto_bruto_provider,
          monto_fee_provider,
          monto_marketplace_fee,
          monto_neto_vendedor,
          payload_json,
          fecha_conciliacion
        )
        VALUES (?, 'mercado_pago', ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          provider_payment_id = VALUES(provider_payment_id),
          provider_status = VALUES(provider_status),
          monto_bruto_provider = VALUES(monto_bruto_provider),
          monto_fee_provider = VALUES(monto_fee_provider),
          monto_marketplace_fee = VALUES(monto_marketplace_fee),
          monto_neto_vendedor = VALUES(monto_neto_vendedor),
          payload_json = VALUES(payload_json),
          fecha_conciliacion = NOW()`,
        [
          resultadoPago.id_pago,
          String(pagoMp.id),
          pagoMp.status || null,
          Number(pagoMp.transaction_amount || 0),
          Number(montoFeeProvider || 0),
          Number(pagoMp.marketplace_fee || rows[0].monto_comision || 0),
          montoNetoVendedor,
          JSON.stringify(pagoMp)
        ]
      );

      await connection.query(
        `UPDATE abogado_pasarela_eventos
         SET procesado = 1
         WHERE proveedor = 'mercado_pago'
           AND tipo_evento = 'webhook_payment'
           AND referencia_externa = ?`,
        [String(dataId)]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error en webhookMercadoPago:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al procesar webhook de Mercado Pago'
    });
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
  webhookMercadoPago,
  listarMisPagosCliente,
  listarMisIngresosAbogado
};

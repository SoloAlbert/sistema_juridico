const { pool } = require('../config/db');
const { crearNotificacion } = require('./notificaciones.service');

async function obtenerRelacionPorUsuario(idUsuario, connection = pool) {
  const [clientes] = await connection.query(
    `SELECT c.id_cliente
     FROM clientes c
     WHERE c.id_usuario = ?
     LIMIT 1`,
    [idUsuario]
  );

  const [abogados] = await connection.query(
    `SELECT a.id_abogado
     FROM abogados a
     WHERE a.id_usuario = ?
     LIMIT 1`,
    [idUsuario]
  );

  return {
    id_cliente: clientes[0]?.id_cliente || null,
    id_abogado: abogados[0]?.id_abogado || null
  };
}

async function obtenerContextoCasoWorkflow(idCaso, connection = pool) {
  const [rows] = await connection.query(
    `SELECT
      c.id_caso,
      c.folio_caso,
      c.titulo,
      c.estado,
      c.id_cliente,
      ca.id_asignacion,
      ca.id_abogado,
      ca.monto_acordado,
      ca.porcentaje_comision,
      ca.monto_comision,
      ca.monto_neto_abogado,
      ca.estado_servicio,
      cl_u.id_usuario AS id_usuario_cliente,
      ab_u.id_usuario AS id_usuario_abogado
     FROM casos c
     INNER JOIN caso_asignaciones ca ON ca.id_caso = c.id_caso
     INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
     INNER JOIN usuarios cl_u ON cl_u.id_usuario = cl.id_usuario
     INNER JOIN abogados ab ON ab.id_abogado = ca.id_abogado
     INNER JOIN usuarios ab_u ON ab_u.id_usuario = ab.id_usuario
     WHERE c.id_caso = ?
     LIMIT 1`,
    [idCaso]
  );

  return rows[0] || null;
}

async function asegurarContratoServicio(idCaso, connection = pool) {
  const contexto = await obtenerContextoCasoWorkflow(idCaso, connection);
  if (!contexto) {
    return null;
  }

  const [existente] = await connection.query(
    `SELECT *
     FROM caso_contratos_servicio
     WHERE id_caso = ?
     LIMIT 1`,
    [idCaso]
  );

  if (existente.length > 0) {
    return existente[0];
  }

  const [result] = await connection.query(
    `INSERT INTO caso_contratos_servicio
     (
       id_caso,
       id_asignacion,
       id_cliente,
       id_abogado,
       alcance_servicio,
       estrategia_inicial,
       obligaciones_abogado,
       obligaciones_cliente,
       terminos_liberacion,
      monto_total_retencion,
       estatus_contrato
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'borrador')`,
    [
      contexto.id_caso,
      contexto.id_asignacion,
      contexto.id_cliente,
      contexto.id_abogado,
      'Definir alcance juridico especifico del caso dentro de la plataforma.',
      'Pendiente de definir con el cliente y evidenciar por hitos.',
      'El abogado asume responsabilidad profesional sobre la gestion comprometida hasta su cierre o terminacion formal.',
      'El cliente debera aportar informacion y documentos necesarios para la atencion oportuna del asunto.',
      'La liberacion de fondos se realizara por hitos aprobados por el cliente dentro de la plataforma.',
      Number(contexto.monto_neto_abogado || 0)
    ]
  );

  const [creado] = await connection.query(
    `SELECT *
     FROM caso_contratos_servicio
     WHERE id_contrato_servicio = ?
     LIMIT 1`,
    [result.insertId]
  );

  return creado[0] || null;
}

async function recalcularTotalesContrato(idContratoServicio, connection = pool) {
  const [hitos] = await connection.query(
    `SELECT
      COALESCE(SUM(CASE WHEN estatus_hito IN ('aprobado','liberado') THEN porcentaje_liberacion ELSE 0 END), 0) AS porcentaje_aprobado,
      COALESCE(SUM(CASE WHEN estatus_hito IN ('aprobado','liberado') THEN monto_liberacion ELSE 0 END), 0) AS monto_aprobado
     FROM caso_hitos_trabajo
     WHERE id_contrato_servicio = ?`,
    [idContratoServicio]
  );

  await connection.query(
    `UPDATE caso_contratos_servicio
     SET
       porcentaje_total_liberado = ?,
       monto_total_liberado = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id_contrato_servicio = ?`,
    [
      Number(hitos[0]?.porcentaje_aprobado || 0),
      Number(hitos[0]?.monto_aprobado || 0),
      idContratoServicio
    ]
  );
}

async function obtenerWorkflowCaso(idCaso, connection = pool) {
  const contrato = await asegurarContratoServicio(idCaso, connection);
  if (!contrato) {
    return null;
  }

  await recalcularTotalesContrato(contrato.id_contrato_servicio, connection);

  const [contratos] = await connection.query(
    `SELECT *
     FROM caso_contratos_servicio
     WHERE id_contrato_servicio = ?
     LIMIT 1`,
    [contrato.id_contrato_servicio]
  );

  const [hitos] = await connection.query(
    `SELECT *
     FROM caso_hitos_trabajo
     WHERE id_contrato_servicio = ?
     ORDER BY orden_hito ASC, id_hito_trabajo ASC`,
    [contrato.id_contrato_servicio]
  );

  const [liberaciones] = await connection.query(
    `SELECT *
     FROM caso_liberaciones_pago
     WHERE id_contrato_servicio = ?
     ORDER BY id_liberacion_pago DESC`,
    [contrato.id_contrato_servicio]
  );

  const [disputas] = await connection.query(
    `SELECT *
     FROM caso_disputas
     WHERE id_contrato_servicio = ?
     ORDER BY id_disputa DESC`,
    [contrato.id_contrato_servicio]
  );

  const [alertas] = await connection.query(
    `SELECT *
     FROM caso_cumplimiento_alertas
     WHERE id_caso = ?
     ORDER BY id_cumplimiento_alerta DESC`,
    [idCaso]
  );

  return {
    contrato: contratos[0] || contrato,
    hitos,
    liberaciones,
    disputas,
    alertas
  };
}

async function notificarWorkflowCambio({ contexto, titulo, mensaje, connection = pool }) {
  await Promise.all([
    crearNotificacion({
      id_usuario: contexto.id_usuario_cliente,
      tipo_notificacion: 'sistema',
      titulo,
      mensaje,
      connection
    }),
    crearNotificacion({
      id_usuario: contexto.id_usuario_abogado,
      tipo_notificacion: 'sistema',
      titulo,
      mensaje,
      connection
    })
  ]);
}

module.exports = {
  obtenerRelacionPorUsuario,
  obtenerContextoCasoWorkflow,
  asegurarContratoServicio,
  recalcularTotalesContrato,
  obtenerWorkflowCaso,
  notificarWorkflowCambio
};

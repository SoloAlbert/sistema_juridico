const { pool } = require('../config/db');
const { crearNotificacion } = require('./notificaciones.service');

async function recalcularCumplimientoAbogado(idAbogado, connection = pool) {
  const [abogadoRows] = await connection.query(
    `SELECT a.id_abogado, a.id_usuario
     FROM abogados a
     WHERE a.id_abogado = ?
     LIMIT 1`,
    [idAbogado]
  );

  if (abogadoRows.length === 0) {
    return null;
  }

  const abogado = abogadoRows[0];

  const [alertasRows] = await connection.query(
    `SELECT
      COUNT(*) AS total_alertas,
      SUM(CASE WHEN tipo_alerta IN ('pago_externo','contacto_externo') AND estatus_alerta IN ('activa','confirmada') THEN 1 ELSE 0 END) AS alertas_evasion,
      SUM(CASE WHEN tipo_alerta IN ('advertencia','multa','bloqueo') AND estatus_alerta IN ('activa','confirmada') THEN 1 ELSE 0 END) AS alertas_disciplina
     FROM caso_cumplimiento_alertas
     WHERE id_usuario_reportado = ?`,
    [abogado.id_usuario]
  );

  const [disputasRows] = await connection.query(
    `SELECT
      COUNT(*) AS total_disputas_abiertas,
      SUM(CASE WHEN tipo_disputa IN ('abandono_caso','incumplimiento') AND estatus_disputa IN ('abierta','en_revision') THEN 1 ELSE 0 END) AS disputas_graves
     FROM caso_disputas cd
     INNER JOIN caso_contratos_servicio ccs ON ccs.id_contrato_servicio = cd.id_contrato_servicio
     WHERE ccs.id_abogado = ?
       AND cd.estatus_disputa IN ('abierta','en_revision')`,
    [idAbogado]
  );

  const totalAlertas = Number(alertasRows[0]?.total_alertas || 0);
  const alertasEvasion = Number(alertasRows[0]?.alertas_evasion || 0);
  const alertasDisciplina = Number(alertasRows[0]?.alertas_disciplina || 0);
  const totalDisputasAbiertas = Number(disputasRows[0]?.total_disputas_abiertas || 0);
  const disputasGraves = Number(disputasRows[0]?.disputas_graves || 0);

  let reputacion = 100
    - (alertasEvasion * 25)
    - (alertasDisciplina * 10)
    - (disputasGraves * 20)
    - (Math.max(totalDisputasAbiertas - disputasGraves, 0) * 8);

  reputacion = Math.max(0, reputacion);

  let estatusCumplimiento = 'normal';
  let cumplimientoHabilitadoCasos = 1;

  if (alertasEvasion >= 2 || disputasGraves >= 2 || reputacion < 50) {
    estatusCumplimiento = 'bloqueado';
    cumplimientoHabilitadoCasos = 0;
  } else if (alertasEvasion >= 1 || disputasGraves >= 1 || reputacion < 70) {
    estatusCumplimiento = 'restringido';
    cumplimientoHabilitadoCasos = 0;
  } else if (totalAlertas > 0 || totalDisputasAbiertas > 0 || reputacion < 90) {
    estatusCumplimiento = 'observado';
  }

  await connection.query(
    `UPDATE abogados
     SET
       reputacion_cumplimiento = ?,
       estatus_cumplimiento = ?,
       total_alertas_cumplimiento = ?,
       total_disputas_abiertas = ?,
       cumplimiento_habilitado_casos = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id_abogado = ?`,
    [
      reputacion,
      estatusCumplimiento,
      totalAlertas,
      totalDisputasAbiertas,
      cumplimientoHabilitadoCasos,
      idAbogado
    ]
  );

  let titulo = null;
  let mensaje = null;

  if (estatusCumplimiento === 'bloqueado') {
    titulo = 'Bloqueo automatico de cumplimiento';
    mensaje = 'Se detectaron alertas o disputas graves. Tu cuenta quedo bloqueada para tomar nuevos casos hasta revision administrativa.';
  } else if (estatusCumplimiento === 'restringido') {
    titulo = 'Restriccion temporal para nuevos casos';
    mensaje = 'Tu perfil tiene incidencias de cumplimiento y no podra tomar nuevos casos hasta corregirlas o pasar revision.';
  } else if (estatusCumplimiento === 'observado') {
    titulo = 'Perfil en observacion';
    mensaje = 'Tu perfil tiene alertas o disputas activas. Mantente dentro de la plataforma y cumple los hitos acordados.';
  }

  if (titulo && abogado.id_usuario) {
    await crearNotificacion({
      id_usuario: abogado.id_usuario,
      tipo_notificacion: 'sistema',
      titulo,
      mensaje,
      connection
    });
  }

  return {
    id_abogado: idAbogado,
    reputacion_cumplimiento: reputacion,
    estatus_cumplimiento: estatusCumplimiento,
    total_alertas_cumplimiento: totalAlertas,
    total_disputas_abiertas: totalDisputasAbiertas,
    cumplimiento_habilitado_casos: cumplimientoHabilitadoCasos
  };
}

module.exports = {
  recalcularCumplimientoAbogado
};

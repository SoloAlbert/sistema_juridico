const { pool } = require('../config/db');

const asegurarRegistroVerificacion = async (id_abogado, connection = null) => {
  const executor = connection || pool;

  const [rows] = await executor.query(
    `SELECT *
     FROM abogado_verificaciones
     WHERE id_abogado = ?
     LIMIT 1`,
    [id_abogado]
  );

  if (rows.length > 0) return rows[0];

  await executor.query(
    `INSERT INTO abogado_verificaciones (id_abogado)
     VALUES (?)`,
    [id_abogado]
  );

  const [nuevo] = await executor.query(
    `SELECT *
     FROM abogado_verificaciones
     WHERE id_abogado = ?
     LIMIT 1`,
    [id_abogado]
  );

  return nuevo[0];
};

const recalcularEstadoVerificacion = async (id_abogado, connection = null) => {
  const executor = connection || pool;

  await asegurarRegistroVerificacion(id_abogado, executor);

  const [docs] = await executor.query(
    `SELECT tipo_documento, estatus_revision
     FROM abogado_documentos_verificacion
     WHERE id_abogado = ?
       AND deleted_at IS NULL`,
    [id_abogado]
  );

  const tieneIdentidad = docs.some((d) =>
    ['identificacion_oficial', 'selfie_validacion'].includes(d.tipo_documento)
  );

  const tieneCedula = docs.some((d) => d.tipo_documento === 'cedula_profesional');

  const identidadAprobada = docs.some(
    (d) => d.tipo_documento === 'identificacion_oficial' && d.estatus_revision === 'aprobado'
  ) && docs.some(
    (d) => d.tipo_documento === 'selfie_validacion' && d.estatus_revision === 'aprobado'
  );

  const identidadPendiente = docs.some(
    (d) =>
      ['identificacion_oficial', 'selfie_validacion'].includes(d.tipo_documento) &&
      d.estatus_revision === 'pendiente'
  );

  const identidadObservada = docs.some(
    (d) =>
      ['identificacion_oficial', 'selfie_validacion'].includes(d.tipo_documento) &&
      d.estatus_revision === 'observado'
  );

  const identidadRechazada = docs.some(
    (d) =>
      ['identificacion_oficial', 'selfie_validacion'].includes(d.tipo_documento) &&
      d.estatus_revision === 'rechazado'
  );

  const cedulaAprobada = docs.some(
    (d) => d.tipo_documento === 'cedula_profesional' && d.estatus_revision === 'aprobado'
  );

  const cedulaPendiente = docs.some(
    (d) => d.tipo_documento === 'cedula_profesional' && d.estatus_revision === 'pendiente'
  );

  const cedulaObservada = docs.some(
    (d) => d.tipo_documento === 'cedula_profesional' && d.estatus_revision === 'observado'
  );

  const cedulaRechazada = docs.some(
    (d) => d.tipo_documento === 'cedula_profesional' && d.estatus_revision === 'rechazado'
  );

  let estatus_identidad = 'no_enviada';
  if (identidadRechazada) estatus_identidad = 'rechazada';
  else if (identidadObservada) estatus_identidad = 'observada';
  else if (identidadAprobada) estatus_identidad = 'verificada';
  else if (tieneIdentidad || identidadPendiente) estatus_identidad = 'pendiente';

  let estatus_cedula = 'no_enviada';
  if (cedulaRechazada) estatus_cedula = 'rechazada';
  else if (cedulaObservada) estatus_cedula = 'observada';
  else if (cedulaAprobada) estatus_cedula = 'verificada';
  else if (tieneCedula || cedulaPendiente) estatus_cedula = 'pendiente';

  let porcentaje = 0;
  if (tieneIdentidad) porcentaje += 50;
  if (tieneCedula) porcentaje += 50;

  let estatus_general = 'incompleto';
  let badge_verificado = 0;

  if (estatus_identidad === 'verificada' && estatus_cedula === 'verificada') {
    estatus_general = 'verificado';
    badge_verificado = 1;
    porcentaje = 100;
  } else if (
    estatus_identidad === 'rechazada' ||
    estatus_cedula === 'rechazada'
  ) {
    estatus_general = 'rechazado';
  } else if (
    estatus_identidad === 'observada' ||
    estatus_cedula === 'observada'
  ) {
    estatus_general = 'observado';
  } else if (
    ['pendiente', 'verificada'].includes(estatus_identidad) ||
    ['pendiente', 'verificada'].includes(estatus_cedula)
  ) {
    estatus_general = 'pendiente';
  }

  await executor.query(
    `UPDATE abogado_verificaciones
     SET
       estatus_identidad = ?,
       estatus_cedula = ?,
       estatus_general = ?,
       badge_verificado = ?,
       porcentaje_completado = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id_abogado = ?`,
    [
      estatus_identidad,
      estatus_cedula,
      estatus_general,
      badge_verificado,
      porcentaje,
      id_abogado
    ]
  );

  const [resultado] = await executor.query(
    `SELECT *
     FROM abogado_verificaciones
     WHERE id_abogado = ?
     LIMIT 1`,
    [id_abogado]
  );

  return resultado[0];
};

module.exports = {
  asegurarRegistroVerificacion,
  recalcularEstadoVerificacion
};
const { pool } = require('../config/db');

const normalizarTexto = (valor = '') =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const limpiarCadena = (valor = '') => String(valor || '').trim();

const limpiarSoloAlfanumerico = (valor = '') =>
  String(valor || '')
    .replace(/[^a-z0-9]/gi, '')
    .trim()
    .toUpperCase();

const construirDetalleValidacion = ({
  tieneDatos,
  tieneIdentidad,
  tieneCedulaDoc,
  nombreCoincide,
  apellidosCoinciden,
  cedulaCoincide
}) => {
  if (!tieneDatos) {
    return 'Captura tus datos de identidad y cédula para activar la validación automática.';
  }

  const mensajes = [];

  if (!tieneIdentidad) {
    mensajes.push('Falta subir identificación oficial y selfie de validación.');
  }

  if (!tieneCedulaDoc) {
    mensajes.push('Falta subir el documento de cédula profesional.');
  }

  if (nombreCoincide === false) {
    mensajes.push('El nombre capturado no coincide con el nombre del perfil.');
  }

  if (apellidosCoinciden === false) {
    mensajes.push('Los apellidos capturados no coinciden con el perfil.');
  }

  if (cedulaCoincide === false) {
    mensajes.push('La cédula capturada no coincide con la cédula del perfil profesional.');
  }

  if (mensajes.length === 0) {
    return 'Los datos capturados coinciden con el perfil actual y los documentos requeridos ya fueron enviados.';
  }

  return mensajes.join(' ');
};

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

  const verificacionActual = await asegurarRegistroVerificacion(id_abogado, executor);

  const [docs] = await executor.query(
    `SELECT tipo_documento, estatus_revision
     FROM abogado_documentos_verificacion
     WHERE id_abogado = ?
       AND deleted_at IS NULL`,
    [id_abogado]
  );

  const [abogadoRows] = await executor.query(
    `SELECT
      a.cedula_profesional,
      u.nombre,
      u.apellido_paterno,
      u.apellido_materno
     FROM abogados a
     INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
     WHERE a.id_abogado = ?
     LIMIT 1`,
    [id_abogado]
  );

  const abogado = abogadoRows[0] || {};

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

  const nombrePerfil = normalizarTexto(abogado.nombre);
  const apellidoPaternoPerfil = normalizarTexto(abogado.apellido_paterno);
  const apellidoMaternoPerfil = normalizarTexto(abogado.apellido_materno);
  const cedulaPerfil = limpiarSoloAlfanumerico(abogado.cedula_profesional);

  const datosNombre = limpiarCadena(verificacionActual.datos_nombre);
  const datosApellidoPaterno = limpiarCadena(verificacionActual.datos_apellido_paterno);
  const datosApellidoMaterno = limpiarCadena(verificacionActual.datos_apellido_materno);
  const curp = limpiarSoloAlfanumerico(verificacionActual.curp);
  const claveElector = limpiarSoloAlfanumerico(verificacionActual.clave_elector);
  const numeroCedulaReportada = limpiarSoloAlfanumerico(verificacionActual.numero_cedula_reportada);

  const tieneDatos =
    !!datosNombre ||
    !!datosApellidoPaterno ||
    !!datosApellidoMaterno ||
    !!curp ||
    !!claveElector ||
    !!numeroCedulaReportada;

  const nombreCoincide = datosNombre
    ? normalizarTexto(datosNombre) === nombrePerfil
    : null;

  const apellidosCoinciden = datosApellidoPaterno || datosApellidoMaterno
    ? (
      normalizarTexto(datosApellidoPaterno) === apellidoPaternoPerfil &&
      normalizarTexto(datosApellidoMaterno) === apellidoMaternoPerfil
    )
    : null;

  const cedulaCoincide = numeroCedulaReportada
    ? numeroCedulaReportada === cedulaPerfil
    : null;

  let validacion_datos_estatus = 'sin_datos';
  if (tieneDatos) {
    validacion_datos_estatus = 'pendiente';

    if (nombreCoincide === false || apellidosCoinciden === false || cedulaCoincide === false) {
      validacion_datos_estatus = 'inconsistente';
    } else if (
      nombreCoincide === true &&
      apellidosCoinciden === true &&
      (cedulaCoincide === true || (!numeroCedulaReportada && !cedulaPerfil))
    ) {
      validacion_datos_estatus = 'coincide';
    }
  }

  const validacion_datos_detalle = construirDetalleValidacion({
    tieneDatos,
    tieneIdentidad,
    tieneCedulaDoc: tieneCedula,
    nombreCoincide,
    apellidosCoinciden,
    cedulaCoincide
  });

  let estatus_general = 'incompleto';
  let badge_verificado = 0;

  const cedulaOficialValida = verificacionActual.cedula_validacion_estatus === 'valida';
  const datosConsistentes = validacion_datos_estatus === 'coincide';

  if (
    estatus_identidad === 'verificada' &&
    estatus_cedula === 'verificada' &&
    cedulaOficialValida &&
    datosConsistentes
  ) {
    estatus_general = 'verificado';
    badge_verificado = 1;
    porcentaje = 100;
  } else if (
    estatus_identidad === 'rechazada' ||
    estatus_cedula === 'rechazada' ||
    verificacionActual.cedula_validacion_estatus === 'no_encontrada'
  ) {
    estatus_general = 'rechazado';
  } else if (
    estatus_identidad === 'observada' ||
    estatus_cedula === 'observada' ||
    validacion_datos_estatus === 'inconsistente' ||
    verificacionActual.cedula_validacion_estatus === 'inconsistente'
  ) {
    estatus_general = 'observado';
  } else if (
    ['pendiente', 'verificada'].includes(estatus_identidad) ||
    ['pendiente', 'verificada'].includes(estatus_cedula) ||
    ['pendiente', 'sin_validar', 'valida'].includes(verificacionActual.cedula_validacion_estatus) ||
    ['pendiente', 'coincide'].includes(validacion_datos_estatus)
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
       validacion_datos_estatus = ?,
       validacion_datos_detalle = ?,
       coincidencia_nombre = ?,
       coincidencia_apellidos = ?,
       coincidencia_cedula = ?,
       datos_validados_at = NOW(),
       updated_at = CURRENT_TIMESTAMP
      WHERE id_abogado = ?`,
     [
       estatus_identidad,
       estatus_cedula,
       estatus_general,
       badge_verificado,
       porcentaje,
       validacion_datos_estatus,
       validacion_datos_detalle,
       nombreCoincide,
       apellidosCoinciden,
       cedulaCoincide,
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

  await executor.query(
    `UPDATE abogados
     SET
       estatus_verificacion = ?,
       cedula_verificada = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id_abogado = ?`,
    [
      resultado[0]?.estatus_general === 'verificado' ? 'verificado' : (
        resultado[0]?.estatus_general === 'rechazado' ? 'rechazado' : 'pendiente'
      ),
      resultado[0]?.cedula_validacion_estatus === 'valida' ? 1 : 0,
      id_abogado
    ]
  );

  return resultado[0];
};

const guardarDatosVerificacion = async (id_abogado, payload = {}, connection = null) => {
  const executor = connection || pool;

  await asegurarRegistroVerificacion(id_abogado, executor);

  await executor.query(
    `UPDATE abogado_verificaciones
     SET
       datos_nombre = ?,
       datos_apellido_paterno = ?,
       datos_apellido_materno = ?,
       curp = ?,
       clave_elector = ?,
       numero_cedula_reportada = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id_abogado = ?`,
    [
      limpiarCadena(payload.datos_nombre) || null,
      limpiarCadena(payload.datos_apellido_paterno) || null,
      limpiarCadena(payload.datos_apellido_materno) || null,
      limpiarSoloAlfanumerico(payload.curp) || null,
      limpiarSoloAlfanumerico(payload.clave_elector) || null,
      limpiarSoloAlfanumerico(payload.numero_cedula_reportada) || null,
      id_abogado
    ]
  );

  return recalcularEstadoVerificacion(id_abogado, executor);
};

const guardarValidacionCedulaAdmin = async (id_abogado, payload = {}, connection = null) => {
  const executor = connection || pool;

  await asegurarRegistroVerificacion(id_abogado, executor);

  await executor.query(
    `UPDATE abogado_verificaciones
     SET
       cedula_validacion_estatus = ?,
       cedula_validacion_fuente = ?,
       cedula_validacion_nombre = ?,
       cedula_validacion_institucion = ?,
       cedula_validacion_carrera = ?,
       cedula_validacion_anio = ?,
       cedula_validacion_detalle = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id_abogado = ?`,
    [
      payload.cedula_validacion_estatus || 'sin_validar',
      limpiarCadena(payload.cedula_validacion_fuente) || null,
      limpiarCadena(payload.cedula_validacion_nombre) || null,
      limpiarCadena(payload.cedula_validacion_institucion) || null,
      limpiarCadena(payload.cedula_validacion_carrera) || null,
      limpiarCadena(payload.cedula_validacion_anio) || null,
      limpiarCadena(payload.cedula_validacion_detalle) || null,
      id_abogado
    ]
  );

  return recalcularEstadoVerificacion(id_abogado, executor);
};

module.exports = {
  asegurarRegistroVerificacion,
  recalcularEstadoVerificacion,
  guardarDatosVerificacion,
  guardarValidacionCedulaAdmin
};

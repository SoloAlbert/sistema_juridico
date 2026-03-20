const { pool } = require('../config/db');
const { recalcularCumplimientoAbogado } = require('../services/cumplimientoAbogado.service');
const {
  obtenerRelacionPorUsuario,
  obtenerContextoCasoWorkflow,
  asegurarContratoServicio,
  recalcularTotalesContrato,
  obtenerWorkflowCaso,
  notificarWorkflowCambio
} = require('../services/casoWorkflow.service');

async function validarAccesoCaso(req, connection = pool) {
  const { id_usuario, role } = req.user;
  const { id } = req.params;
  const contexto = await obtenerContextoCasoWorkflow(id, connection);

  if (!contexto) {
    return { ok: false, status: 404, message: 'Caso asignado no encontrado' };
  }

  const relacion = await obtenerRelacionPorUsuario(id_usuario, connection);

  if (role === 'cliente' && relacion.id_cliente === contexto.id_cliente) {
    return { ok: true, actor: 'cliente', contexto };
  }

  if (role === 'abogado' && relacion.id_abogado === contexto.id_abogado) {
    return { ok: true, actor: 'abogado', contexto };
  }

  if (role === 'admin') {
    return { ok: true, actor: 'admin', contexto };
  }

  return { ok: false, status: 403, message: 'No tienes acceso al workflow del caso' };
}

const obtenerWorkflow = async (req, res) => {
  try {
    const acceso = await validarAccesoCaso(req);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso);
    return res.json({ ok: true, data });
  } catch (error) {
    console.error('Error en obtenerWorkflow:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener workflow del caso' });
  }
};

const guardarContrato = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    if (!['cliente', 'admin'].includes(acceso.actor)) {
      return res.status(403).json({ ok: false, message: 'Solo cliente o admin pueden definir el acuerdo inicial' });
    }

    const {
      alcance_servicio,
      estrategia_inicial,
      obligaciones_abogado,
      obligaciones_cliente,
      terminos_liberacion
    } = req.body;

    const contrato = await asegurarContratoServicio(acceso.contexto.id_caso, connection);

    await connection.query(
      `UPDATE caso_contratos_servicio
       SET
         alcance_servicio = ?,
         estrategia_inicial = ?,
         obligaciones_abogado = ?,
         obligaciones_cliente = ?,
         terminos_liberacion = ?,
         estatus_contrato = CASE
           WHEN firmado_cliente = 1 AND firmado_abogado = 1 THEN 'activo'
           ELSE 'borrador'
         END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_contrato_servicio = ?`,
      [
        alcance_servicio || contrato.alcance_servicio,
        estrategia_inicial || contrato.estrategia_inicial,
        obligaciones_abogado || contrato.obligaciones_abogado,
        obligaciones_cliente || contrato.obligaciones_cliente,
        terminos_liberacion || contrato.terminos_liberacion,
        contrato.id_contrato_servicio
      ]
    );

    await notificarWorkflowCambio({
      contexto: acceso.contexto,
      titulo: 'Acuerdo del caso actualizado',
      mensaje: `Se actualizo el alcance y reglas de trabajo del caso ${acceso.contexto.folio_caso}.`,
      connection
    });

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    return res.json({ ok: true, message: 'Acuerdo del caso actualizado', data });
  } catch (error) {
    console.error('Error en guardarContrato:', error);
    return res.status(500).json({ ok: false, message: 'Error al guardar acuerdo del caso' });
  } finally {
    connection.release();
  }
};

const firmarContrato = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    if (!['cliente', 'abogado'].includes(acceso.actor)) {
      return res.status(403).json({ ok: false, message: 'Solo cliente y abogado pueden firmar el acuerdo' });
    }

    const contrato = await asegurarContratoServicio(acceso.contexto.id_caso, connection);
    const campo = acceso.actor === 'cliente' ? 'firmado_cliente' : 'firmado_abogado';
    const campoFecha = acceso.actor === 'cliente' ? 'fecha_firma_cliente' : 'fecha_firma_abogado';

    await connection.query(
      `UPDATE caso_contratos_servicio
       SET
         ${campo} = 1,
         ${campoFecha} = NOW(),
         estatus_contrato = CASE
           WHEN (CASE WHEN ? = 'cliente' THEN 1 ELSE firmado_cliente END) = 1
             AND (CASE WHEN ? = 'abogado' THEN 1 ELSE firmado_abogado END) = 1
           THEN 'activo'
           ELSE estatus_contrato
         END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_contrato_servicio = ?`,
      [acceso.actor, acceso.actor, contrato.id_contrato_servicio]
    );

    await notificarWorkflowCambio({
      contexto: acceso.contexto,
      titulo: 'Acuerdo firmado',
      mensaje: `${acceso.actor === 'cliente' ? 'El cliente' : 'El abogado'} firmo el acuerdo operativo del caso ${acceso.contexto.folio_caso}.`,
      connection
    });

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    return res.json({ ok: true, message: 'Acuerdo firmado correctamente', data });
  } catch (error) {
    console.error('Error en firmarContrato:', error);
    return res.status(500).json({ ok: false, message: 'Error al firmar el acuerdo' });
  } finally {
    connection.release();
  }
};

const crearHito = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    if (!['cliente', 'admin'].includes(acceso.actor)) {
      return res.status(403).json({ ok: false, message: 'Solo cliente o admin pueden definir hitos' });
    }

    const {
      titulo,
      descripcion,
      porcentaje_liberacion,
      evidencia_requerida,
      fecha_objetivo
    } = req.body;

    if (!titulo || !porcentaje_liberacion) {
      return res.status(400).json({ ok: false, message: 'Titulo y porcentaje_liberacion son obligatorios' });
    }

    const porcentaje = Number(porcentaje_liberacion);
    if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
      return res.status(400).json({ ok: false, message: 'El porcentaje de liberacion debe estar entre 0 y 100' });
    }

    const contrato = await asegurarContratoServicio(acceso.contexto.id_caso, connection);
    const [sumatoria] = await connection.query(
      `SELECT COALESCE(SUM(porcentaje_liberacion), 0) AS total
       FROM caso_hitos_trabajo
       WHERE id_contrato_servicio = ?`,
      [contrato.id_contrato_servicio]
    );

    const totalActual = Number(sumatoria[0]?.total || 0);
    if (totalActual + porcentaje > 100.01) {
      return res.status(400).json({ ok: false, message: 'La suma de hitos no puede exceder 100% del monto retenido' });
    }

    const [ultimo] = await connection.query(
      `SELECT COALESCE(MAX(orden_hito), 0) AS ultimo
       FROM caso_hitos_trabajo
       WHERE id_contrato_servicio = ?`,
      [contrato.id_contrato_servicio]
    );

    const monto = Number(((Number(contrato.monto_total_retencion || 0) * porcentaje) / 100).toFixed(2));

    await connection.query(
      `INSERT INTO caso_hitos_trabajo
       (
         id_contrato_servicio,
         orden_hito,
         titulo,
         descripcion,
         porcentaje_liberacion,
         monto_liberacion,
         evidencia_requerida,
         fecha_objetivo
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contrato.id_contrato_servicio,
        Number(ultimo[0]?.ultimo || 0) + 1,
        titulo,
        descripcion || null,
        porcentaje,
        monto,
        evidencia_requerida || null,
        fecha_objetivo || null
      ]
    );

    await notificarWorkflowCambio({
      contexto: acceso.contexto,
      titulo: 'Hito agregado al caso',
      mensaje: `Se agrego un nuevo hito de trabajo al caso ${acceso.contexto.folio_caso}.`,
      connection
    });

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    return res.status(201).json({ ok: true, message: 'Hito agregado', data });
  } catch (error) {
    console.error('Error en crearHito:', error);
    return res.status(500).json({ ok: false, message: 'Error al crear hito del caso' });
  } finally {
    connection.release();
  }
};

const actualizarAvanceHito = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    if (acceso.actor !== 'abogado') {
      return res.status(403).json({ ok: false, message: 'Solo el abogado puede reportar avances' });
    }

    const { idHito } = req.params;
    const { evidencia_entregada, estatus_hito } = req.body;

    const workflow = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    const hito = (workflow.hitos || []).find((item) => Number(item.id_hito_trabajo) === Number(idHito));

    if (!hito) {
      return res.status(404).json({ ok: false, message: 'Hito no encontrado' });
    }

    const nuevoEstado = estatus_hito === 'en_progreso' ? 'en_progreso' : 'entregado';

    await connection.query(
      `UPDATE caso_hitos_trabajo
       SET
         evidencia_entregada = ?,
         estatus_hito = ?,
         fecha_entrega = CASE WHEN ? = 'entregado' THEN NOW() ELSE fecha_entrega END,
         solicitud_liberacion = CASE WHEN ? = 'entregado' THEN 1 ELSE solicitud_liberacion END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_hito_trabajo = ?`,
      [
        evidencia_entregada || hito.evidencia_entregada,
        nuevoEstado,
        nuevoEstado,
        nuevoEstado,
        idHito
      ]
    );

    if (nuevoEstado === 'entregado') {
      await connection.query(
        `INSERT INTO caso_liberaciones_pago
         (
           id_contrato_servicio,
           id_hito_trabajo,
           porcentaje_liberado,
           monto_liberado,
           estatus_liberacion,
           observaciones
         )
         VALUES (?, ?, ?, ?, 'pendiente', ?)` ,
        [
          workflow.contrato.id_contrato_servicio,
          hito.id_hito_trabajo,
          hito.porcentaje_liberacion,
          hito.monto_liberacion,
          'Solicitud de liberacion enviada por el abogado.'
        ]
      );
    }

    await crearNotificacion({
      id_usuario: acceso.contexto.id_usuario_cliente,
      tipo_notificacion: 'sistema',
      titulo: 'Avance entregado por tu abogado',
      mensaje: `El abogado marco como entregado el hito "${hito.titulo}" del caso ${acceso.contexto.folio_caso}.`,
      connection
    });

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    return res.json({ ok: true, message: 'Avance guardado correctamente', data });
  } catch (error) {
    console.error('Error en actualizarAvanceHito:', error);
    return res.status(500).json({ ok: false, message: 'Error al actualizar avance del hito' });
  } finally {
    connection.release();
  }
};

const aprobarHito = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    if (acceso.actor !== 'cliente') {
      return res.status(403).json({ ok: false, message: 'Solo el cliente puede aprobar liberaciones' });
    }

    const { idHito } = req.params;
    const { observaciones_cliente } = req.body;
    const workflow = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    const hito = (workflow.hitos || []).find((item) => Number(item.id_hito_trabajo) === Number(idHito));

    if (!hito) {
      return res.status(404).json({ ok: false, message: 'Hito no encontrado' });
    }

    await connection.query(
      `UPDATE caso_hitos_trabajo
       SET
         estatus_hito = 'liberado',
         observaciones_cliente = ?,
         fecha_aprobacion = NOW(),
         solicitud_liberacion = 0,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_hito_trabajo = ?`,
      [observaciones_cliente || null, idHito]
    );

    await connection.query(
      `UPDATE caso_liberaciones_pago
       SET
         estatus_liberacion = 'ejecutada',
         aprobado_por_cliente = 1,
         id_pago = (
           SELECT p.id_pago
           FROM pagos p
           WHERE p.id_asignacion = ?
             AND p.id_caso = ?
           ORDER BY p.id_pago DESC
           LIMIT 1
         ),
         observaciones = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_contrato_servicio = ?
         AND id_hito_trabajo = ?
         AND estatus_liberacion = 'pendiente'`,
      [
        acceso.contexto.id_asignacion,
        acceso.contexto.id_caso,
        observaciones_cliente || 'Liberacion aprobada por el cliente.',
        workflow.contrato.id_contrato_servicio,
        idHito
      ]
    );

    await recalcularTotalesContrato(workflow.contrato.id_contrato_servicio, connection);

    const [pagos] = await connection.query(
      `SELECT
        id_pago,
        id_abogado,
        monto_neto_abogado
       FROM pagos
       WHERE id_asignacion = ?
         AND id_caso = ?
       ORDER BY id_pago DESC
       LIMIT 1`,
      [acceso.contexto.id_asignacion, acceso.contexto.id_caso]
    );

    if (pagos.length > 0) {
      const pago = pagos[0];

      await connection.query(
        `INSERT INTO movimientos_financieros
         (tipo_movimiento, id_pago, id_usuario, monto, descripcion)
         VALUES ('retiro_abogado', ?, ?, ?, ?)`,
        [
          pago.id_pago,
          acceso.contexto.id_usuario_abogado,
          hito.monto_liberacion,
          `Liberacion aprobada por hito "${hito.titulo}" del caso #${acceso.contexto.id_caso}`
        ]
      );

      await connection.query(
        `UPDATE abogados
         SET total_ingresos = total_ingresos + ?
         WHERE id_abogado = ?`,
        [hito.monto_liberacion, pago.id_abogado]
      );

      const [liberado] = await connection.query(
        `SELECT COALESCE(SUM(monto_liberado), 0) AS total
         FROM caso_liberaciones_pago
         WHERE id_pago = ?
           AND estatus_liberacion IN ('aprobada', 'ejecutada')`,
        [pago.id_pago]
      );

      const totalLiberado = Number(liberado[0]?.total || 0);
      const nuevoEstatusPago = totalLiberado + 0.009 >= Number(pago.monto_neto_abogado || 0)
        ? 'pagado'
        : 'retenido';
      const nuevoEstadoServicio = nuevoEstatusPago === 'pagado' ? 'pagado' : 'retenido';

      await connection.query(
        `UPDATE pagos
         SET estatus_pago = ?
         WHERE id_pago = ?`,
        [nuevoEstatusPago, pago.id_pago]
      );

      await connection.query(
        `UPDATE caso_asignaciones
         SET estado_servicio = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_asignacion = ?`,
        [nuevoEstadoServicio, acceso.contexto.id_asignacion]
      );
    }

    await crearNotificacion({
      id_usuario: acceso.contexto.id_usuario_abogado,
      tipo_notificacion: 'sistema',
      titulo: 'Liberacion aprobada',
      mensaje: `El cliente aprobo la liberacion del hito "${hito.titulo}" del caso ${acceso.contexto.folio_caso}.`,
      connection
    });

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    return res.json({ ok: true, message: 'Hito aprobado y liberacion registrada', data });
  } catch (error) {
    console.error('Error en aprobarHito:', error);
    return res.status(500).json({ ok: false, message: 'Error al aprobar el hito' });
  } finally {
    connection.release();
  }
};

const observarHito = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    if (acceso.actor !== 'cliente') {
      return res.status(403).json({ ok: false, message: 'Solo el cliente puede observar hitos' });
    }

    const { idHito } = req.params;
    const { observaciones_cliente } = req.body;

    await connection.query(
      `UPDATE caso_hitos_trabajo
       SET
         estatus_hito = 'observado',
         observaciones_cliente = ?,
         solicitud_liberacion = 0,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_hito_trabajo = ?`,
      [observaciones_cliente || 'El cliente solicito ajustes antes de liberar fondos.', idHito]
    );

    const workflow = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    await crearNotificacion({
      id_usuario: acceso.contexto.id_usuario_abogado,
      tipo_notificacion: 'sistema',
      titulo: 'Hito observado',
      mensaje: `El cliente observo un avance del caso ${acceso.contexto.folio_caso}. Revisa comentarios y corrige antes de solicitar liberacion.`,
      connection
    });

    return res.json({ ok: true, message: 'Hito observado correctamente', data: workflow });
  } catch (error) {
    console.error('Error en observarHito:', error);
    return res.status(500).json({ ok: false, message: 'Error al observar el hito' });
  } finally {
    connection.release();
  }
};

const crearDisputa = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    const { tipo_disputa, motivo, evidencia } = req.body;
    if (!motivo) {
      return res.status(400).json({ ok: false, message: 'El motivo de la disputa es obligatorio' });
    }

    const workflow = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    await connection.query(
      `INSERT INTO caso_disputas
       (
         id_contrato_servicio,
         id_caso,
         id_reportante_usuario,
         tipo_disputa,
         motivo,
         evidencia
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        workflow.contrato.id_contrato_servicio,
        acceso.contexto.id_caso,
        req.user.id_usuario,
        tipo_disputa || 'otro',
        motivo,
        evidencia || null
      ]
    );

    await connection.query(
      `UPDATE caso_contratos_servicio
       SET estatus_contrato = 'en_disputa',
           updated_at = CURRENT_TIMESTAMP
       WHERE id_contrato_servicio = ?`,
      [workflow.contrato.id_contrato_servicio]
    );

    await notificarWorkflowCambio({
      contexto: acceso.contexto,
      titulo: 'Disputa abierta',
      mensaje: `Se abrio una disputa en el caso ${acceso.contexto.folio_caso}. La plataforma debera revisar el cumplimiento del servicio.`,
      connection
    });

    await recalcularCumplimientoAbogado(acceso.contexto.id_abogado, connection);

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    return res.status(201).json({ ok: true, message: 'Disputa creada correctamente', data });
  } catch (error) {
    console.error('Error en crearDisputa:', error);
    return res.status(500).json({ ok: false, message: 'Error al crear disputa' });
  } finally {
    connection.release();
  }
};

const crearAlertaCumplimiento = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const acceso = await validarAccesoCaso(req, connection);
    if (!acceso.ok) {
      return res.status(acceso.status).json({ ok: false, message: acceso.message });
    }

    const { tipo_alerta, motivo } = req.body;
    if (!tipo_alerta || !motivo) {
      return res.status(400).json({ ok: false, message: 'tipo_alerta y motivo son obligatorios' });
    }

    const idUsuarioReportado = acceso.actor === 'cliente'
      ? acceso.contexto.id_usuario_abogado
      : acceso.contexto.id_usuario_cliente;

    await connection.query(
      `INSERT INTO caso_cumplimiento_alertas
       (
         id_caso,
         id_usuario_reportado,
         id_usuario_reportante,
         tipo_alerta,
         motivo
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        acceso.contexto.id_caso,
        idUsuarioReportado,
        req.user.id_usuario,
        tipo_alerta,
        motivo
      ]
    );

    await crearNotificacion({
      id_usuario: idUsuarioReportado,
      tipo_notificacion: 'sistema',
      titulo: 'Alerta de cumplimiento',
      mensaje: `Se registro una alerta de cumplimiento en el caso ${acceso.contexto.folio_caso}. Evita pagos o negociaciones por fuera de la plataforma.`,
      connection
    });

    if (idUsuarioReportado === acceso.contexto.id_usuario_abogado) {
      await recalcularCumplimientoAbogado(acceso.contexto.id_abogado, connection);
    }

    const data = await obtenerWorkflowCaso(acceso.contexto.id_caso, connection);
    return res.status(201).json({ ok: true, message: 'Alerta registrada correctamente', data });
  } catch (error) {
    console.error('Error en crearAlertaCumplimiento:', error);
    return res.status(500).json({ ok: false, message: 'Error al registrar alerta de cumplimiento' });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerWorkflow,
  guardarContrato,
  firmarContrato,
  crearHito,
  actualizarAvanceHito,
  aprobarHito,
  observarHito,
  crearDisputa,
  crearAlertaCumplimiento
};

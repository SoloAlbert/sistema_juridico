const { pool } = require('../config/db');
const { recalcularCumplimientoAbogado } = require('../services/cumplimientoAbogado.service');

async function listarCumplimientoAdmin(req, res) {
  try {
    const [alertas] = await pool.query(
      `SELECT
        cca.id_cumplimiento_alerta,
        cca.id_caso,
        cca.id_usuario_reportado,
        cca.id_usuario_reportante,
        cca.tipo_alerta,
        cca.motivo,
        cca.estatus_alerta,
        cca.monto_multa,
        cca.created_at,
        ur.nombre AS reportado_nombre,
        ur.apellido_paterno AS reportado_apellido_paterno,
        ur.apellido_materno AS reportado_apellido_materno,
        up.nombre AS reportante_nombre,
        up.apellido_paterno AS reportante_apellido_paterno,
        up.apellido_materno AS reportante_apellido_materno,
        a.id_abogado,
        a.reputacion_cumplimiento,
        a.estatus_cumplimiento
       FROM caso_cumplimiento_alertas cca
       LEFT JOIN usuarios ur ON ur.id_usuario = cca.id_usuario_reportado
       LEFT JOIN usuarios up ON up.id_usuario = cca.id_usuario_reportante
       LEFT JOIN abogados a ON a.id_usuario = cca.id_usuario_reportado
       ORDER BY cca.id_cumplimiento_alerta DESC`
    );

    const [disputas] = await pool.query(
      `SELECT
        cd.id_disputa,
        cd.id_contrato_servicio,
        cd.id_caso,
        cd.id_reportante_usuario,
        cd.tipo_disputa,
        cd.motivo,
        cd.evidencia,
        cd.estatus_disputa,
        cd.resolucion,
        cd.reviewed_by,
        cd.reviewed_at,
        cd.created_at,
        u.nombre AS reportante_nombre,
        u.apellido_paterno AS reportante_apellido_paterno,
        u.apellido_materno AS reportante_apellido_materno,
        a.id_abogado,
        ab.reputacion_cumplimiento,
        ab.estatus_cumplimiento
       FROM caso_disputas cd
       LEFT JOIN usuarios u ON u.id_usuario = cd.id_reportante_usuario
       LEFT JOIN caso_contratos_servicio ccs ON ccs.id_contrato_servicio = cd.id_contrato_servicio
       LEFT JOIN abogados ab ON ab.id_abogado = ccs.id_abogado
       LEFT JOIN abogados a ON a.id_abogado = ccs.id_abogado
       ORDER BY cd.id_disputa DESC`
    );

    return res.json({
      ok: true,
      data: {
        alertas,
        disputas
      }
    });
  } catch (error) {
    console.error('Error en listarCumplimientoAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar cumplimiento y disputas'
    });
  }
}

async function resolverAlertaCumplimientoAdmin(req, res) {
  const connection = await pool.getConnection();
  try {
    const { idAlerta } = req.params;
    const { estatus_alerta, monto_multa } = req.body;

    if (!['confirmada', 'descartada', 'cumplida'].includes(estatus_alerta)) {
      return res.status(400).json({
        ok: false,
        message: 'estatus_alerta invalido'
      });
    }

    const [rows] = await connection.query(
      `SELECT cca.*, a.id_abogado
       FROM caso_cumplimiento_alertas cca
       LEFT JOIN abogados a ON a.id_usuario = cca.id_usuario_reportado
       WHERE cca.id_cumplimiento_alerta = ?
       LIMIT 1`,
      [idAlerta]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Alerta no encontrada'
      });
    }

    const alerta = rows[0];

    await connection.query(
      `UPDATE caso_cumplimiento_alertas
       SET
         estatus_alerta = ?,
         monto_multa = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id_cumplimiento_alerta = ?`,
      [
        estatus_alerta,
        Number(monto_multa || 0),
        idAlerta
      ]
    );

    let cumplimiento = null;
    if (alerta.id_abogado) {
      cumplimiento = await recalcularCumplimientoAbogado(alerta.id_abogado, connection);
    }

    return res.json({
      ok: true,
      message: 'Alerta actualizada correctamente',
      data: {
        cumplimiento
      }
    });
  } catch (error) {
    console.error('Error en resolverAlertaCumplimientoAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al resolver alerta'
    });
  } finally {
    connection.release();
  }
}

async function resolverDisputaAdmin(req, res) {
  const connection = await pool.getConnection();
  try {
    const { idDisputa } = req.params;
    const { estatus_disputa, resolucion } = req.body;
    const { id_usuario } = req.user;

    if (!['en_revision', 'resuelta_cliente', 'resuelta_abogado', 'cerrada'].includes(estatus_disputa)) {
      return res.status(400).json({
        ok: false,
        message: 'estatus_disputa invalido'
      });
    }

    const [rows] = await connection.query(
      `SELECT cd.*, ccs.id_abogado, ccs.id_contrato_servicio
       FROM caso_disputas cd
       LEFT JOIN caso_contratos_servicio ccs ON ccs.id_contrato_servicio = cd.id_contrato_servicio
       WHERE cd.id_disputa = ?
       LIMIT 1`,
      [idDisputa]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Disputa no encontrada'
      });
    }

    const disputa = rows[0];

    await connection.query(
      `UPDATE caso_disputas
       SET
         estatus_disputa = ?,
         resolucion = ?,
         reviewed_by = ?,
         reviewed_at = NOW(),
         updated_at = CURRENT_TIMESTAMP
       WHERE id_disputa = ?`,
      [
        estatus_disputa,
        resolucion || null,
        id_usuario,
        idDisputa
      ]
    );

    if (['resuelta_cliente', 'resuelta_abogado', 'cerrada'].includes(estatus_disputa)) {
      await connection.query(
        `UPDATE caso_contratos_servicio
         SET
           estatus_contrato = 'activo',
           updated_at = CURRENT_TIMESTAMP
         WHERE id_contrato_servicio = ?
           AND estatus_contrato = 'en_disputa'`,
        [disputa.id_contrato_servicio]
      );
    }

    let cumplimiento = null;
    if (disputa.id_abogado) {
      cumplimiento = await recalcularCumplimientoAbogado(disputa.id_abogado, connection);
    }

    return res.json({
      ok: true,
      message: 'Disputa actualizada correctamente',
      data: {
        cumplimiento
      }
    });
  } catch (error) {
    console.error('Error en resolverDisputaAdmin:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al resolver disputa'
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  listarCumplimientoAdmin,
  resolverAlertaCumplimientoAdmin,
  resolverDisputaAdmin
};

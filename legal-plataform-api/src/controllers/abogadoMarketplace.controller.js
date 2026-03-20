const { pool } = require('../config/db');
const {
  encryptText,
  signState,
  verifyState,
  buildOAuthAuthorizationUrl,
  exchangeAuthorizationCode
} = require('../services/mercadoPagoMarketplace.service');

function getFrontendAbogadoRedirectBase() {
  const base = (process.env.APP_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('Falta APP_URL');
  }

  return `${base}/abogado/mi-perfil`;
}

async function obtenerAbogadoPorUsuario(idUsuario, connection = pool) {
  const [rows] = await connection.query(
    'SELECT id_abogado, id_usuario, nombre_despacho FROM abogados WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );

  return rows[0] || null;
}

const obtenerEstadoMercadoPagoAbogado = async (req, res) => {
  try {
    const abogado = await obtenerAbogadoPorUsuario(req.user.id_usuario);

    if (!abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id_abogado_pasarela_cuenta,
        proveedor,
        mp_user_id,
        collector_id,
        public_key,
        scope,
        live_mode,
        estado_conexion,
        ultima_sincronizacion,
        fecha_conexion,
        created_at,
        updated_at
      FROM abogado_pasarela_cuentas
      WHERE id_abogado = ?
        AND proveedor = 'mercado_pago'
      LIMIT 1`,
      [abogado.id_abogado]
    );

    return res.json({
      ok: true,
      data: {
        id_abogado: abogado.id_abogado,
        conectado: rows.length > 0 && rows[0].estado_conexion === 'conectada',
        cuenta: rows[0] || null
      }
    });
  } catch (error) {
    console.error('Error en obtenerEstadoMercadoPagoAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener estado de Mercado Pago'
    });
  }
};

const generarUrlConexionMercadoPago = async (req, res) => {
  try {
    const abogado = await obtenerAbogadoPorUsuario(req.user.id_usuario);

    if (!abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    const state = signState({
      id_usuario: req.user.id_usuario,
      id_abogado: abogado.id_abogado,
      ts: Date.now()
    });

    const authUrl = buildOAuthAuthorizationUrl(state);

    return res.json({
      ok: true,
      data: {
        auth_url: authUrl
      }
    });
  } catch (error) {
    console.error('Error en generarUrlConexionMercadoPago:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al generar URL de conexion con Mercado Pago'
    });
  }
};

const completarOAuthMercadoPago = async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;
    const redirectBase = getFrontendAbogadoRedirectBase();

    if (oauthError) {
      return res.redirect(`${redirectBase}?mp_connect=error`);
    }

    if (!code || !state) {
      return res.redirect(`${redirectBase}?mp_connect=invalid`);
    }

    const stateData = verifyState(state);
    const abogado = await obtenerAbogadoPorUsuario(stateData.id_usuario);

    if (!abogado || Number(abogado.id_abogado) !== Number(stateData.id_abogado)) {
      return res.redirect(`${redirectBase}?mp_connect=invalid`);
    }

    const oauthData = await exchangeAuthorizationCode(code);

    await pool.query(
      `INSERT INTO abogado_pasarela_cuentas
      (
        id_abogado,
        proveedor,
        mp_user_id,
        collector_id,
        public_key,
        access_token_enc,
        refresh_token_enc,
        scope,
        live_mode,
        estado_conexion,
        ultima_sincronizacion,
        fecha_conexion
      )
      VALUES (?, 'mercado_pago', ?, ?, ?, ?, ?, ?, ?, 'conectada', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        mp_user_id = VALUES(mp_user_id),
        collector_id = VALUES(collector_id),
        public_key = VALUES(public_key),
        access_token_enc = VALUES(access_token_enc),
        refresh_token_enc = VALUES(refresh_token_enc),
        scope = VALUES(scope),
        live_mode = VALUES(live_mode),
        estado_conexion = 'conectada',
        ultima_sincronizacion = NOW(),
        fecha_conexion = COALESCE(fecha_conexion, NOW())`,
      [
        abogado.id_abogado,
        oauthData.user_id || null,
        oauthData.user_id || null,
        oauthData.public_key || null,
        encryptText(oauthData.access_token),
        encryptText(oauthData.refresh_token),
        oauthData.scope || null,
        oauthData.live_mode ? 1 : 0
      ]
    );

    await pool.query(
      `INSERT INTO abogado_pasarela_eventos
      (id_abogado, proveedor, tipo_evento, referencia_externa, payload_json, procesado)
      VALUES (?, 'mercado_pago', 'oauth_connected', ?, ?, 1)`,
      [
        abogado.id_abogado,
        String(oauthData.user_id || ''),
        JSON.stringify({
          user_id: oauthData.user_id,
          scope: oauthData.scope,
          live_mode: oauthData.live_mode
        })
      ]
    );

    return res.redirect(`${redirectBase}?mp_connect=success`);
  } catch (error) {
    console.error('Error en completarOAuthMercadoPago:', error);
    try {
      return res.redirect(`${getFrontendAbogadoRedirectBase()}?mp_connect=error`);
    } catch {
      return res.status(500).json({
        ok: false,
        message: 'Error al completar conexion OAuth con Mercado Pago'
      });
    }
  }
};

const desconectarMercadoPagoAbogado = async (req, res) => {
  try {
    const abogado = await obtenerAbogadoPorUsuario(req.user.id_usuario);

    if (!abogado) {
      return res.status(404).json({
        ok: false,
        message: 'Abogado no encontrado'
      });
    }

    await pool.query(
      `UPDATE abogado_pasarela_cuentas
       SET estado_conexion = 'revocada',
           access_token_enc = NULL,
           refresh_token_enc = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_abogado = ?
         AND proveedor = 'mercado_pago'`,
      [abogado.id_abogado]
    );

    await pool.query(
      `INSERT INTO abogado_pasarela_eventos
      (id_abogado, proveedor, tipo_evento, payload_json, procesado)
      VALUES (?, 'mercado_pago', 'oauth_revoked', '{}', 1)`,
      [abogado.id_abogado]
    );

    return res.json({
      ok: true,
      message: 'Cuenta de Mercado Pago desconectada'
    });
  } catch (error) {
    console.error('Error en desconectarMercadoPagoAbogado:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al desconectar Mercado Pago'
    });
  }
};

module.exports = {
  obtenerEstadoMercadoPagoAbogado,
  generarUrlConexionMercadoPago,
  completarOAuthMercadoPago,
  desconectarMercadoPagoAbogado
};

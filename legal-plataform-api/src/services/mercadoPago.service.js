require('dotenv').config();

const MP_API_BASE = process.env.MP_API_BASE_URL || 'https://api.mercadopago.com';

function getAccessToken(customToken) {
  const token = customToken || process.env.MP_ACCESS_TOKEN;

  if (!token) {
    throw new Error('Falta configurar MP_ACCESS_TOKEN');
  }

  return token;
}

async function mpFetch(path, options = {}) {
  const token = getAccessToken(options.accessToken);

  const response = await fetch(`${MP_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || `Mercado Pago respondio con ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function crearPreferenciaMercadoPago(payload) {
  return mpFetch('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function crearPreferenciaMercadoPagoConToken(payload, accessToken) {
  return mpFetch('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify(payload),
    accessToken
  });
}

async function obtenerPagoMercadoPago(idPago, accessToken) {
  return mpFetch(`/v1/payments/${idPago}`, {
    method: 'GET',
    accessToken
  });
}

module.exports = {
  crearPreferenciaMercadoPago,
  crearPreferenciaMercadoPagoConToken,
  obtenerPagoMercadoPago
};

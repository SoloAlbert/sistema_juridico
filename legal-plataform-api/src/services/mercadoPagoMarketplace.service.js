const crypto = require('crypto');

const MP_API_BASE = process.env.MP_API_BASE_URL || 'https://api.mercadopago.com';
const MP_OAUTH_BASE = process.env.MP_OAUTH_BASE_URL || 'https://auth.mercadopago.com';

function getIntegratorCredentials() {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri = process.env.MP_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Faltan MP_CLIENT_ID, MP_CLIENT_SECRET o MP_REDIRECT_URI');
  }

  return { clientId, clientSecret, redirectUri };
}

function getEncryptionSecret() {
  const secret = process.env.MP_TOKEN_ENCRYPTION_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Falta MP_TOKEN_ENCRYPTION_SECRET o JWT_SECRET');
  }

  return crypto.createHash('sha256').update(secret).digest();
}

function encryptText(value) {
  if (!value) return null;

  const key = getEncryptionSecret();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptText(value) {
  if (!value) return null;

  const [ivHex, encryptedHex] = String(value).split(':');
  if (!ivHex || !encryptedHex) return null;

  const key = getEncryptionSecret();
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

function signState(payload) {
  const secret = getEncryptionSecret();
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyState(token) {
  if (!token || !String(token).includes('.')) {
    throw new Error('State invalido');
  }

  const [encodedPayload, signature] = String(token).split('.');
  const secret = getEncryptionSecret();
  const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  if (signature !== expected) {
    throw new Error('State no valido');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  const ageMs = Date.now() - Number(payload.ts || 0);
  if (!payload.ts || ageMs > 10 * 60 * 1000) {
    throw new Error('State expirado');
  }

  return payload;
}

function buildOAuthAuthorizationUrl(state) {
  const { clientId, redirectUri } = getIntegratorCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: redirectUri,
    state
  });

  return `${MP_OAUTH_BASE}/authorization?${params.toString()}`;
}

async function exchangeAuthorizationCode(code) {
  const { clientId, clientSecret, redirectUri } = getIntegratorCredentials();

  const response = await fetch(`${MP_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Error OAuth Mercado Pago');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

module.exports = {
  encryptText,
  decryptText,
  signState,
  verifyState,
  buildOAuthAuthorizationUrl,
  exchangeAuthorizationCode
};

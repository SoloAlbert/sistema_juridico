# Mercado Pago

## Variables requeridas

Agrega estas variables a `legal-plataform-api/.env`:

```env
APP_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:3003
MP_API_BASE_URL=https://api.mercadopago.com
MP_ACCESS_TOKEN=APP_USR-TU_ACCESS_TOKEN
MP_CLIENT_ID=TU_APP_ID_MP
MP_CLIENT_SECRET=TU_CLIENT_SECRET_MP
MP_REDIRECT_URI=http://localhost:3003/api/abogados/mercado-pago/oauth/callback
MP_TOKEN_ENCRYPTION_SECRET=CAMBIA_ESTA_LLAVE_PARA_CIFRAR_TOKENS
```

## Que hace cada variable

- `APP_URL`: URL del frontend. Mercado Pago regresara aqui despues del checkout.
- `PUBLIC_API_URL`: URL publica del backend. Mercado Pago enviara aqui el webhook.
- `MP_API_BASE_URL`: usa `https://api.mercadopago.com` en produccion y sandbox.
- `MP_ACCESS_TOKEN`: access token privado de tu cuenta de Mercado Pago.
- `MP_CLIENT_ID`: App ID del integrador para OAuth.
- `MP_CLIENT_SECRET`: Client secret del integrador para OAuth.
- `MP_REDIRECT_URI`: callback registrada en tu app de Mercado Pago.
- `MP_TOKEN_ENCRYPTION_SECRET`: llave local para cifrar tokens de abogados conectados.

## Flujo implementado

1. El cliente entra a pagar el caso.
2. El backend crea una preferencia en Mercado Pago.
3. El frontend redirige al checkout de Mercado Pago.
4. Mercado Pago llama al webhook del backend.
5. Solo si el pago llega como `approved`, el sistema registra el pago en la BD.
6. La plataforma retiene 10% y el abogado recibe 90%.

## Base marketplace agregada

Se agrego base para estas fases:

- conexion OAuth de abogados
- guardado cifrado de cuentas conectadas
- checkout con `marketplace_fee` cuando el abogado ya esta conectado
- registro de eventos webhook
- tablas de conciliacion y disputas para crecer despues

Script SQL:

- `sql/2026-03-19-mercadopago-marketplace.sql`

## Datos que ya existen en tu base

En tu respaldo `C:\\tmp\\abogados.sql` ya existe:

- tabla `metodos_pago`
- registro `id_metodo_pago = 3` con nombre `mercado_pago`
- tabla `pagos` con estado `cancelado` incluido

## Importante para pruebas locales

El webhook de Mercado Pago necesita una URL publica del backend.
Si pruebas localmente, usa una herramienta tipo tunel para exponer `http://localhost:3003`.

Ejemplo:

```powershell
ngrok http 3003
```

Despues actualiza `PUBLIC_API_URL` con la URL publica generada por el tunel.

## Como obtener el access token

1. Entra a tu cuenta de Mercado Pago Developers.
2. Ve a Credenciales.
3. Copia el `Access Token` de pruebas para sandbox.
4. Pegalo en `MP_ACCESS_TOKEN`.

## Siguiente paso recomendado

Probar primero en sandbox:

1. levantar backend y frontend
2. asignar un caso nuevo
3. abrir pago del caso
4. pagar con usuario de prueba de Mercado Pago
5. verificar que el webhook cambie el caso a `en_proceso`

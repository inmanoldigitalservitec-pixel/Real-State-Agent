# Variables de Entorno

No guardes secretos reales en archivos versionados.

## Agent Core

```env
NODE_ENV=development
AGENT_CORE_PORT=8787
AGENT_INTERNAL_API_KEY=replace-locally
```

- `AGENT_CORE_PORT`: puerto HTTP de Agent Core.
- `AGENT_INTERNAL_API_KEY`: token Bearer requerido para `/internal/*`.

## Public Chat

```env
PUBLIC_CHAT_ENABLED=true
PUBLIC_CHAT_ALLOWED_ORIGINS=http://localhost:5173
PUBLIC_CHAT_MAX_MESSAGE_LENGTH=4000
PUBLIC_CHAT_MAX_BODY_BYTES=16384
PUBLIC_CHAT_RATE_LIMIT_WINDOW_MS=60000
PUBLIC_CHAT_RATE_LIMIT_MAX_REQUESTS=20
PUBLIC_CHAT_MAX_CONCURRENT_REQUESTS=3
PUBLIC_CHAT_TIMEOUT_SECONDS=120
PUBLIC_CHAT_TRUST_PROXY=false
```

- `PUBLIC_CHAT_ENABLED`: habilita o deshabilita las rutas `/public/*`.
- `PUBLIC_CHAT_ALLOWED_ORIGINS`: allowlist CORS separada por comas.
- `PUBLIC_CHAT_MAX_MESSAGE_LENGTH`: límite documental del mensaje público.
- `PUBLIC_CHAT_MAX_BODY_BYTES`: tamaño máximo del body en bytes.
- `PUBLIC_CHAT_RATE_LIMIT_WINDOW_MS`: ventana temporal del rate limit.
- `PUBLIC_CHAT_RATE_LIMIT_MAX_REQUESTS`: solicitudes máximas por ventana.
- `PUBLIC_CHAT_MAX_CONCURRENT_REQUESTS`: chats simultáneos permitidos.
- `PUBLIC_CHAT_TIMEOUT_SECONDS`: timeout máximo de cada solicitud.
- `PUBLIC_CHAT_TRUST_PROXY`: permite confiar en headers de IP del proxy.

El contrato compartido acepta mensajes de hasta 4,000 caracteres. Una configuración futura más estricta puede reducir ese límite, pero no aumentarlo sin versionar el contrato.

En producción, configura únicamente los orígenes reales:

```env
PUBLIC_CHAT_ALLOWED_ORIGINS=https://chat.example.com,https://www.example.com
```

No uses una allowlist abierta.

Mientras Agent Core reciba tráfico directo:

```env
PUBLIC_CHAT_TRUST_PROXY=false
```

Activa `PUBLIC_CHAT_TRUST_PROXY=true` solamente cuando el servicio esté detrás de un proxy confiable y el acceso directo esté bloqueado.

## OpenClaw Agent Client

```env
OPENCLAW_BIN=openclaw
OPENCLAW_AGENT_ID=real-estate-agent
```

- `OPENCLAW_BIN`: binario que Agent Core ejecuta mediante `spawn`.
- `OPENCLAW_AGENT_ID`: agente fijo usado por el backend público.

En esta instalación local, el binario disponible es:

```text
/Users/inma/.npm-global/bin/openclaw
```

No es obligatorio guardar la ruta completa si `openclaw` ya está disponible en `PATH`.

Agent Core construye internamente la sesión:

```text
agent:<OPENCLAW_AGENT_ID>:web-<public-session-id>
```

El navegador no debe enviar `agentId` ni `sessionKey`.

## Smoke Test Público

Variables opcionales:

```env
PUBLIC_CHAT_BASE_URL=http://127.0.0.1:8787
PUBLIC_CHAT_SMOKE_FIRST_MESSAGE=Hola Carlos. Busco un apartamento de 3 habitaciones en Villa Mella.
PUBLIC_CHAT_SMOKE_SECOND_MESSAGE=Mi presupuesto máximo es de RD$8,000,000. ¿Qué opciones tienes?
```

- `PUBLIC_CHAT_BASE_URL`: URL usada por el smoke test.
- `PUBLIC_CHAT_SMOKE_FIRST_MESSAGE`: primer mensaje de la conversación.
- `PUBLIC_CHAT_SMOKE_SECOND_MESSAGE`: segundo mensaje con la misma sesión.

Si `PUBLIC_CHAT_BASE_URL` no existe, el script usa:

```text
OPENCLAW_AGENT_CORE_BASE_URL
```

y finalmente:

```text
http://127.0.0.1:8787
```

## Web Chat

```env
VITE_AGENT_CORE_URL=http://localhost:8787
```

El frontend debe usar esta URL para llamar a:

```text
GET  /public/health
POST /public/chat
```

Nunca debe llamar directamente a OpenClaw Gateway ni a `/internal/*`.

### Configuración Local del Frontend

Archivo local:

```text
apps/web-chat/.env.local
```

Ejemplo local:

```env
VITE_AGENT_CORE_URL=http://127.0.0.1:8787
```

Ejemplo con Quick Tunnel:

```env
VITE_AGENT_CORE_URL=https://BACKEND-TEMPORAL.trycloudflare.com
```

Vite carga las variables `VITE_*` al iniciar. Reinicia el servidor de desarrollo después de modificar `.env.local`.

`apps/web-chat/.env.local` está cubierto por `.gitignore` y no debe versionarse.

No guardes URLs temporales concretas de `trycloudflare.com` en documentos, código ni archivos versionados.

### CORS Para Frontend Temporal

Cuando el frontend se publique mediante un segundo Quick Tunnel:

```env
PUBLIC_CHAT_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://FRONTEND-TEMPORAL.trycloudflare.com
```

El origen debe coincidir exactamente con el que aparece en el navegador.


## Supabase

```env
SUPABASE_URL=replace-locally
SUPABASE_ANON_KEY=replace-locally
SUPABASE_SERVICE_ROLE_KEY=replace-locally
```

Agent Core usa Supabase mediante servicios y repositorios. OpenClaw no debe usar estas variables directamente.

## OpenClaw y Plugin Interno

```env
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_AGENT_CORE_BASE_URL=http://127.0.0.1:8787
OPENCLAW_AGENT_CORE_API_KEY=replace-locally
```

- `OPENCLAW_BASE_URL`: referencia al Gateway local.
- `OPENCLAW_AGENT_CORE_BASE_URL`: URL usada por el plugin para llamar a Agent Core.
- `OPENCLAW_AGENT_CORE_API_KEY`: Bearer token que el plugin envía a `/internal/*`.

Estas variables deben representar la misma clave funcional:

```text
AGENT_INTERNAL_API_KEY
OPENCLAW_AGENT_CORE_API_KEY
```

Si no coinciden, Agent Core responde `UNAUTHORIZED`.

## Archivos Locales

- `.env`: cargado por Agent Core mediante `loadMonorepoEnv`.
- `.env.local`: usado por comandos locales de Carlos cuando corresponda.
- `.env.example`: referencia versionada sin secretos.
- `openclaw-workspace/plugins/real-estate-tools/.env.example`: ejemplo del plugin.

Mantén `.env` y `.env.local` alineados cuando compartan configuración funcional.

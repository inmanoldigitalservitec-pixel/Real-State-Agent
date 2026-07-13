# Troubleshooting

## Public Health Responde Pero `/public/chat` Devuelve 500

Síntoma:

```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_ERROR",
    "message": "The chat agent is temporarily unavailable",
    "retryable": true
  }
}
```

Esto significa que la frontera pública funciona, pero falló la ejecución o validación de OpenClaw.

Prueba el CLI directamente:

```bash
SESSION_ID="smoke-debug-$(date +%s)"
SESSION_KEY="agent:real-estate-agent:web-$SESSION_ID"

openclaw agent \
  --agent real-estate-agent \
  --session-key "$SESSION_KEY" \
  --message "Hola Carlos. Responde solamente con un saludo corto." \
  --json \
  --timeout 120
```

Revisa:

- código de salida;
- stdout JSON;
- stderr;
- agente configurado;
- credenciales;
- estructura real del payload.

## OpenClaw Devuelve `mediaUrl: null`

El CLI real puede responder:

```json
{
  "payloads": [
    {
      "text": "Hola, encantado de ayudarte.",
      "mediaUrl": null
    }
  ]
}
```

Esto es válido.

El cliente interno debe aceptar `null` tanto en `text` como en `mediaUrl` cuando esos campos sean opcionales.

Si el schema acepta solamente `string | undefined`, Agent Core rechazará una respuesta válida y devolverá `EXTERNAL_ERROR`.

Archivo relevante:

```text
apps/agent-core/src/integrations/openclaw/openclaw-agent.client.ts
```

Test de regresión:

```text
apps/agent-core/tests/unit/openclaw-agent.client.test.ts
```

## `using external OAuth credential after refresh failure`

OpenClaw puede registrar:

```text
[agents/auth-profiles] using external OAuth credential after refresh failure
```

Si la ejecución termina con:

```text
status: ok
stopReason: stop
```

y devuelve una respuesta visible, la advertencia no bloqueó la conversación.

Debe investigarse si:

- las ejecuciones comienzan a fallar;
- aparecen errores 401;
- no se puede refrescar ninguna credencial;
- el fallback externo deja de estar disponible.

## Advertencia `state-migrations`

Puede aparecer:

```text
[state-migrations] Legacy state migration warnings
```

Si el proceso termina con código `0`, esta advertencia no invalida la respuesta.

No debe exponerse al navegador porque el backend únicamente devuelve contenido público normalizado.

## El Smoke Se Detiene Después de `publicHealth`

El primer mensaje real puede tardar mientras OpenClaw:

- carga el agente;
- resuelve autenticación;
- ejecuta tools;
- consulta Agent Core;
- consulta Supabase;
- construye la respuesta.

El timeout predeterminado es de 120 segundos.

No cierres OpenClaw Gateway ni Agent Core mientras el proceso siga activo.

## No Se Puede Conectar a Agent Core

Verifica:

```bash
curl -s http://127.0.0.1:8787/public/health | python3 -m json.tool
```

Si falla, inicia Agent Core:

```bash
cd "/Users/inma/Documents/Real State Agent"
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core dev
```

## OpenClaw Gateway No Responde

Verifica:

```bash
curl -s http://127.0.0.1:18789/ >/dev/null && \
  echo "OpenClaw Gateway responde" || \
  echo "No se pudo conectar con OpenClaw Gateway"
```

Inícialo:

```bash
openclaw gateway --port 18789
```

También puedes revisar:

```bash
openclaw gateway status
openclaw health
openclaw agents list
```

El agente esperado es:

```text
real-estate-agent
```

## Origen Bloqueado Por CORS

Síntoma:

```text
CORS_ORIGIN_DENIED
```

Agrega el origen exacto, sin slash final, a:

```env
PUBLIC_CHAT_ALLOWED_ORIGINS=http://localhost:5173
```

Para varios orígenes:

```env
PUBLIC_CHAT_ALLOWED_ORIGINS=https://chat.example.com,https://www.example.com
```

No uses `*`.

## Rate Limit o Concurrencia

Errores posibles:

```text
RATE_LIMITED
TOO_MANY_CONCURRENT_REQUESTS
```

Variables:

```env
PUBLIC_CHAT_RATE_LIMIT_WINDOW_MS=60000
PUBLIC_CHAT_RATE_LIMIT_MAX_REQUESTS=20
PUBLIC_CHAT_MAX_CONCURRENT_REQUESTS=3
```

El rate limit actual vive en memoria. Reiniciar Agent Core reinicia los contadores.

## Timeout Público

Error:

```text
CHAT_TIMEOUT
```

Variable:

```env
PUBLIC_CHAT_TIMEOUT_SECONDS=120
```

Antes de aumentarlo, revisa:

- latencia de OpenClaw;
- autenticación;
- tools lentas;
- consultas a Supabase;
- procesos atascados.

## Todas las Solicitudes Directas Comparten Rate Limit

Con:

```env
PUBLIC_CHAT_TRUST_PROXY=false
```

Agent Core no confía en `x-forwarded-for` ni `cf-connecting-ip`. El tráfico directo comparte un bucket conservador.

Solo usa:

```env
PUBLIC_CHAT_TRUST_PROXY=true
```

cuando Agent Core esté detrás de un proxy confiable y el acceso directo esté bloqueado.

## Carlos No Usa `search_properties`

Verifica:

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
openclaw skills check --agent real-estate-agent
openclaw skills list --agent real-estate-agent
```

Revisa:

```text
openclaw-workspace/TOOLS.md
openclaw-workspace/plugins/real-estate-tools/openclaw.plugin.json
openclaw-workspace/plugins/real-estate-tools/src/index.ts
```

## `UNAUTHORIZED` Desde Rutas Internas

Estas variables deben tener el mismo valor funcional:

```text
AGENT_INTERNAL_API_KEY
OPENCLAW_AGENT_CORE_API_KEY
```

La primera protege `/internal/*`. La segunda es enviada por el plugin.

## Agent Core No Arranca

Comprueba:

```bash
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core typecheck
pnpm --filter @real-estate-agent/agent-core dev
```

Verifica `.env` y las variables de Supabase.

## SQLite Readonly En OpenClaw

Algunos comandos escriben en:

```text
~/.openclaw/state
```

En entornos restringidos pueden fallar con:

```text
attempt to write a readonly database
```

Repite el comando fuera del sandbox o con permisos adecuados.

## Carlos Devuelve Menos Propiedades de las Esperadas

Revisa:

1. argumentos enviados por el modelo;
2. argumentos recibidos por la tool;
3. payload enviado a Agent Core;
4. servicio y repositorio;
5. límite aplicado;
6. deduplicación;
7. mapeo;
8. presentación final.

Busca límites:

```bash
rg -n "maximum: 3|default: 3|limit: 3|Math.min|slice\(0, 3\)|\.limit\(3\)|MAX_RESULTS|maxResults|resultLimit" \
  apps openclaw-workspace packages
```

## Carlos Comparte la Imagen Como Texto

OpenClaw puede incluir una URL dentro del texto y devolver:

```json
{
  "text": "Imagen referencial: https://example.com/image.jpg",
  "mediaUrl": null
}
```

En ese caso, el backend devuelve un payload `text`, no un payload `media`.

Para obtener medios estructurados, el agente o la integración debe devolver la URL en `mediaUrl`.

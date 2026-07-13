# Testing

## Capas

### Shared

Contratos y schemas compartidos:

```bash
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/shared typecheck
```

### Agent Core

Unit tests:

```bash
pnpm --filter @real-estate-agent/agent-core test:unit
```

Integration tests:

```bash
pnpm --filter @real-estate-agent/agent-core test:integration
```

Suite completa:

```bash
pnpm --filter @real-estate-agent/agent-core test
```

Build y typecheck:

```bash
pnpm --filter @real-estate-agent/agent-core build
pnpm --filter @real-estate-agent/agent-core typecheck
```

## Cobertura del Public Chat

La cobertura actual valida:

- generación de `sessionId` público;
- reutilización de sesión;
- rechazo de campos internos;
- normalización de respuestas de OpenClaw;
- soporte para `mediaUrl: null`;
- filtrado de URLs inseguras;
- errores externos seguros;
- CORS;
- límite del body;
- rate limiting;
- concurrencia;
- timeout;
- integración HTTP completa.

Tests relevantes:

```text
apps/agent-core/tests/unit/openclaw-agent.client.test.ts
apps/agent-core/tests/unit/public-chat.service.test.ts
apps/agent-core/tests/unit/public-chat.routes.test.ts
apps/agent-core/tests/unit/public-security.middleware.test.ts
apps/agent-core/tests/integration/public-chat.integration.test.ts
```

Ejecutarlos juntos:

```bash
pnpm --filter @real-estate-agent/agent-core exec vitest run \
  tests/unit/openclaw-agent.client.test.ts \
  tests/unit/public-chat.service.test.ts \
  tests/unit/public-chat.routes.test.ts \
  tests/unit/public-security.middleware.test.ts \
  tests/integration/public-chat.integration.test.ts
```

## Smoke Tests

Smokes de Agent Core:

```bash
pnpm --filter @real-estate-agent/agent-core smoke:supabase
pnpm --filter @real-estate-agent/agent-core smoke:internal-api
pnpm --filter @real-estate-agent/agent-core smoke:conversation-bootstrap
pnpm --filter @real-estate-agent/agent-core smoke:public-chat
```

## Smoke Real del Public Chat

Requisitos:

1. OpenClaw Gateway activo en `127.0.0.1:18789`.
2. Agent Core activo en `127.0.0.1:8787`.
3. El agente `real-estate-agent` disponible.
4. Credenciales funcionales de OpenClaw.
5. Configuración interna del plugin disponible.

Terminal 1:

```bash
openclaw gateway --port 18789
```

Terminal 2:

```bash
cd "/Users/inma/Documents/Real State Agent"
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core dev
```

Terminal 3:

```bash
cd "/Users/inma/Documents/Real State Agent"
pnpm --filter @real-estate-agent/agent-core smoke:public-chat
```

El smoke valida:

- `GET /public/health`;
- primer mensaje sin sesión;
- creación de `sessionId`;
- segundo mensaje con la misma sesión;
- respuesta visible de Carlos;
- ausencia de metadata interna.

Resultado esperado:

```json
{
  "success": true,
  "publicHealth": true,
  "firstChat": true,
  "secondChat": true,
  "sessionReused": true,
  "internalMetadataExposed": false
}
```

## Web Chat

Typecheck:

```bash
pnpm --filter @real-estate-agent/web-chat typecheck
```

Build de producción:

```bash
pnpm --filter @real-estate-agent/web-chat build
```

Prueba manual mínima:

1. abrir la interfaz;
2. confirmar estado “Disponible”;
3. enviar un primer mensaje;
4. confirmar respuesta de Carlos;
5. enviar un segundo mensaje;
6. comprobar continuidad contextual;
7. recargar la página;
8. confirmar que el `sessionId` continúa en `localStorage`;
9. seleccionar “Nueva conversación”;
10. confirmar que el identificador anterior fue eliminado.

Claves esperadas en almacenamiento:

```text
real-estate-agent-public-session-id
```

Verificaciones de interfaz:

- Enter envía;
- Shift+Enter crea una nueva línea;
- el botón se deshabilita mientras se procesa;
- aparece el indicador de escritura;
- los errores se muestran sin metadata interna;
- el diseño funciona en escritorio y móvil.

## Prueba Manual Con Quick Tunnels

Con backend y frontend publicados temporalmente:

1. abrir la URL del frontend desde otro dispositivo;
2. confirmar que `/public/health` no falla por CORS;
3. enviar dos mensajes;
4. verificar continuidad de sesión;
5. confirmar que ninguna respuesta expone metadata interna.


## Plugin OpenClaw

```bash
pnpm --filter @real-estate-agent/openclaw-real-estate-tools build
pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck
pnpm --filter @real-estate-agent/openclaw-real-estate-tools test
```

Smokes:

```bash
pnpm --filter @real-estate-agent/openclaw-real-estate-tools smoke:health
pnpm --filter @real-estate-agent/openclaw-real-estate-tools smoke:search-properties
```

## OpenClaw Runtime

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
openclaw skills check --agent real-estate-agent
openclaw skills list --agent real-estate-agent
```

Prueba directa:

```bash
openclaw agent \
  --agent real-estate-agent \
  --session-key "agent:real-estate-agent:test-$(date +%s)" \
  --message "Hola Carlos" \
  --json \
  --timeout 120
```

## Orden Recomendado Antes de Commit

Para cambios del backend público:

```bash
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core typecheck
pnpm --filter @real-estate-agent/agent-core test
pnpm --filter @real-estate-agent/agent-core build
```

Con OpenClaw y Agent Core activos:

```bash
pnpm --filter @real-estate-agent/agent-core smoke:public-chat
```

Para cambios documentales:

```bash
git diff --check
rg -n "public/chat|public/health|PUBLIC_CHAT_|smoke:public-chat" README.md docs
```

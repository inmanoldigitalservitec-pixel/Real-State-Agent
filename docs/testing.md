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

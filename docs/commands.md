# Comandos

Ejecuta los comandos desde la raiz salvo que se indique otra ruta.

## Instalacion

```bash
pnpm install
```

## Desarrollo

Todo el workspace:

```bash
pnpm dev
```

Solo `agent-core`:

```bash
pnpm dev:core
pnpm --filter @real-estate-agent/agent-core dev
```

Solo `web-chat`:

```bash
pnpm dev:web
```

## Build y Typecheck

```bash
pnpm build
pnpm typecheck
```

Paquetes concretos:

```bash
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core build
pnpm --filter @real-estate-agent/agent-core typecheck
pnpm --filter @real-estate-agent/openclaw-real-estate-tools build
pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck
```

## Tests

```bash
pnpm --filter @real-estate-agent/agent-core test:unit
pnpm --filter @real-estate-agent/agent-core test:integration
pnpm --filter @real-estate-agent/agent-core smoke:supabase
pnpm --filter @real-estate-agent/agent-core smoke:internal-api
pnpm --filter @real-estate-agent/openclaw-real-estate-tools test
```

## Agent Core

Health publico:

```bash
curl http://127.0.0.1:8787/health
```

Para rutas internas, envia siempre el token:

```bash
curl -H "Authorization: Bearer $AGENT_INTERNAL_API_KEY" \
  http://127.0.0.1:8787/internal/companies/<company-id>/information
```

Nota: `/health` es la verificacion simple porque no requiere datos reales.

## OpenClaw Gateway

Desde el workspace:

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
./scripts/start-gateway.sh
./scripts/stop-gateway.sh
./scripts/check-openclaw.sh
```

Comando directo equivalente cuando aplica:

```bash
openclaw gateway --port 18789
```

## Carlos

Sesion nueva:

```bash
carlos
```

Sesion fija:

```bash
carlos-fijo
```

CLI JSON para pruebas automatizables:

```bash
openclaw agent \
  --agent real-estate-agent \
  --session-key "agent:real-estate-agent:test-$(date +%s)" \
  --message "Usa search_properties con location Santo Domingo, bedrooms 3 y propertyType apartment. Presenta las propiedades encontradas." \
  --json \
  --timeout 240
```

## OpenClaw Skills

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
openclaw skills check --agent real-estate-agent
openclaw skills list --agent real-estate-agent
```

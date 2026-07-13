# Testing

## Capas

### Shared

Contratos y schemas compartidos.

```bash
pnpm --filter @real-estate-agent/shared build
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

Build y typecheck:

```bash
pnpm --filter @real-estate-agent/agent-core build
pnpm --filter @real-estate-agent/agent-core typecheck
```

Smokes:

```bash
pnpm --filter @real-estate-agent/agent-core smoke:supabase
pnpm --filter @real-estate-agent/agent-core smoke:internal-api
pnpm --filter @real-estate-agent/agent-core smoke:conversation-bootstrap
```

### Plugin OpenClaw

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

### OpenClaw Runtime

Desde `openclaw-workspace`:

```bash
openclaw skills check --agent real-estate-agent
openclaw skills list --agent real-estate-agent
```

Prueba CLI:

```bash
openclaw agent \
  --agent real-estate-agent \
  --session-key "agent:real-estate-agent:test-$(date +%s)" \
  --message "Usa search_properties con location Santo Domingo, bedrooms 3 y propertyType apartment. Presenta las propiedades encontradas." \
  --json \
  --timeout 240
```

## Orden Recomendado Antes De Entregar Cambios

Para cambios documentales:

```bash
rg -n "placeholder|solo agent_core_health|no hay tools inmobiliarias|fuera de alcance" \
  README.md docs openclaw-workspace \
  -g "*.md" \
  -g "!docs/research/**" \
  -g "!docs/implementation/**"
```

Para cambios de backend:

```bash
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core typecheck
pnpm --filter @real-estate-agent/agent-core test:unit
```

Para cambios de plugin:

```bash
pnpm --filter @real-estate-agent/openclaw-real-estate-tools build
pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck
pnpm --filter @real-estate-agent/openclaw-real-estate-tools test
```

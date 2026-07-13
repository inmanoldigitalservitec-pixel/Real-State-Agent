# Comandos

Ejecuta los comandos desde la raíz salvo que se indique otra ruta.

## Instalación

```bash
pnpm install
```

## Desarrollo

Todo el workspace:

```bash
pnpm dev
```

Solo Agent Core:

```bash
pnpm dev:core
pnpm --filter @real-estate-agent/agent-core dev
```

Solo frontend:

```bash
pnpm dev:web
```

## Build y Typecheck

```bash
pnpm build
pnpm typecheck
```

Agent Core:

```bash
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core build
pnpm --filter @real-estate-agent/agent-core typecheck
```

Plugin:

```bash
pnpm --filter @real-estate-agent/openclaw-real-estate-tools build
pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck
```

## Iniciar el Backend Público

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

Validar salud pública:

```bash
curl -s http://127.0.0.1:8787/public/health | python3 -m json.tool
```

## Public Chat

Primera solicitud:

```bash
curl -s \
  -X POST \
  http://127.0.0.1:8787/public/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Busco un apartamento de 3 habitaciones en Villa Mella"
  }' | python3 -m json.tool
```

Segunda solicitud con la misma sesión:

```bash
curl -s \
  -X POST \
  http://127.0.0.1:8787/public/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId": "<session-id-devuelto>",
    "message": "Mi presupuesto máximo es RD$8,000,000"
  }' | python3 -m json.tool
```

Smoke real:

```bash
pnpm --filter @real-estate-agent/agent-core smoke:public-chat
```

## Frontend Web

Configurar localmente la URL del backend:

```bash
cat > apps/web-chat/.env.local <<'EOF'
VITE_AGENT_CORE_URL=http://127.0.0.1:8787
EOF
```

Para usar un Quick Tunnel temporal del backend:

```bash
cat > apps/web-chat/.env.local <<'EOF'
VITE_AGENT_CORE_URL=https://BACKEND-TEMPORAL.trycloudflare.com
EOF
```

Iniciar Vite:

```bash
pnpm --filter @real-estate-agent/web-chat dev -- --host 127.0.0.1
```

Abrir localmente:

```text
http://127.0.0.1:5173
```

Validar:

```bash
pnpm --filter @real-estate-agent/web-chat typecheck
pnpm --filter @real-estate-agent/web-chat build
```

## Quick Tunnel Temporal

Backend:

```bash
cloudflared tunnel --url http://127.0.0.1:8787
```

Frontend:

```bash
cloudflared tunnel --url http://127.0.0.1:5173
```

La URL del frontend debe agregarse a la allowlist del backend:

```env
PUBLIC_CHAT_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://FRONTEND-TEMPORAL.trycloudflare.com
```

Después de modificar el `.env`, reinicia Agent Core.

Orden operativo completo:

```text
1. OpenClaw Gateway
2. Agent Core
3. Tunnel del backend
4. Configurar VITE_AGENT_CORE_URL
5. Frontend Vite
6. Tunnel del frontend
7. Agregar origen del frontend a PUBLIC_CHAT_ALLOWED_ORIGINS
8. Reiniciar Agent Core
```

Las URLs `trycloudflare.com` cambian al reiniciar cada túnel.


## Tests

```bash
pnpm --filter @real-estate-agent/agent-core test:unit
pnpm --filter @real-estate-agent/agent-core test:integration
pnpm --filter @real-estate-agent/agent-core test
```

Smokes:

```bash
pnpm --filter @real-estate-agent/agent-core smoke:supabase
pnpm --filter @real-estate-agent/agent-core smoke:internal-api
pnpm --filter @real-estate-agent/agent-core smoke:conversation-bootstrap
pnpm --filter @real-estate-agent/agent-core smoke:public-chat
```

## Agent Core Interno

Health general:

```bash
curl http://127.0.0.1:8787/health
```

Rutas internas:

```bash
curl \
  -H "Authorization: Bearer $AGENT_INTERNAL_API_KEY" \
  http://127.0.0.1:8787/internal/companies/<company-id>/information
```

## OpenClaw

Listar agentes:

```bash
openclaw agents list
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

Skills:

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
openclaw skills check --agent real-estate-agent
openclaw skills list --agent real-estate-agent
```

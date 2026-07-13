# Variables de Entorno

No guardes secretos reales en archivos versionados.

## Agent Core

```env
NODE_ENV=development
AGENT_CORE_PORT=8787
AGENT_INTERNAL_API_KEY=replace-locally
```

- `AGENT_CORE_PORT`: puerto HTTP de `agent-core`.
- `AGENT_INTERNAL_API_KEY`: token Bearer requerido para `/internal/*`.

## Web Chat

```env
VITE_AGENT_CORE_URL=http://localhost:8787
```

Usado por el frontend cuando corresponda.

## Supabase

```env
SUPABASE_URL=replace-locally
SUPABASE_ANON_KEY=replace-locally
SUPABASE_SERVICE_ROLE_KEY=replace-locally
```

`agent-core` usa Supabase mediante servicios y repositorios. OpenClaw no debe usar estas variables directamente.

## OpenClaw

```env
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_AGENT_CORE_BASE_URL=http://127.0.0.1:8787
OPENCLAW_AGENT_CORE_API_KEY=replace-locally
```

- `OPENCLAW_BASE_URL`: URL del gateway local cuando se necesita referenciarlo.
- `OPENCLAW_AGENT_CORE_BASE_URL`: URL que usa el plugin para llamar a `agent-core`.
- `OPENCLAW_AGENT_CORE_API_KEY`: token que envia el plugin a `agent-core`.

## Clave Compartida Entre Agent Core y Plugin

Estas dos variables deben coincidir funcionalmente:

```text
AGENT_INTERNAL_API_KEY
OPENCLAW_AGENT_CORE_API_KEY
```

Si no coinciden, `agent-core` respondera `UNAUTHORIZED` en rutas internas.

## Archivos Locales

- `.env`: cargado por `agent-core` mediante `loadMonorepoEnv`.
- `.env.local`: usado por la funcion local `carlos` si esta configurada en `~/.zshrc`.
- `openclaw-workspace/plugins/real-estate-tools/.env.example`: ejemplo especifico del plugin.

Mantener `.env` y `.env.local` alineados evita fallos donde `agent-core` y Carlos usan claves distintas.


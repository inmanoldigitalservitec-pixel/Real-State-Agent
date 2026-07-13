# Getting Started

Esta guia deja el proyecto operativo en local para desarrollo y pruebas con Carlos.

## Requisitos

- Node.js compatible con el workspace.
- `pnpm` segun `packageManager` del `package.json` raiz.
- Supabase configurado para el entorno local o remoto usado por el proyecto.
- OpenClaw instalado en la maquina.
- `.env` o `.env.local` con las variables necesarias.

## Instalacion

Desde la raiz:

```bash
cd "/Users/inma/Documents/Real State Agent"
pnpm install
```

## Variables Locales

Crea o actualiza `.env` para `agent-core`. Si Carlos se abre con la funcion local `carlos`, esa funcion carga `.env.local`; manten ambas configuraciones alineadas si usas los dos archivos.

Minimo esperado para probar Carlos contra `agent-core`:

```env
NODE_ENV=development
AGENT_CORE_PORT=8787
AGENT_INTERNAL_API_KEY=replace-locally
OPENCLAW_AGENT_CORE_BASE_URL=http://127.0.0.1:8787
OPENCLAW_AGENT_CORE_API_KEY=replace-locally
SUPABASE_URL=replace-locally
SUPABASE_ANON_KEY=replace-locally
SUPABASE_SERVICE_ROLE_KEY=replace-locally
```

`AGENT_INTERNAL_API_KEY` y `OPENCLAW_AGENT_CORE_API_KEY` deben coincidir funcionalmente.

## Levantar Agent Core

```bash
pnpm dev:core
```

Equivalente:

```bash
pnpm --filter @real-estate-agent/agent-core dev
```

Por defecto escucha en:

```text
http://127.0.0.1:8787
```

La ruta publica de salud no requiere token:

```bash
curl http://127.0.0.1:8787/health
```

Las rutas `/internal/*` requieren:

```http
Authorization: Bearer <AGENT_INTERNAL_API_KEY>
```

## Levantar OpenClaw Gateway

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
./scripts/start-gateway.sh
```

El gateway local esperado usa loopback y puerto `18789`.

## Abrir Carlos

Sesion limpia recomendada:

```bash
carlos
```

`carlos` es una funcion local de shell, no un binario del repo. Su comportamiento esperado es:

```bash
carlos() {
  cd "/Users/inma/Documents/Real State Agent" || return 1
  set -a
  source .env.local
  set +a
  openclaw tui --session "agent:real-estate-agent:carlos-$(date +%Y%m%d%H%M%S)"
}
```

Tambien puede existir `carlos-fijo`, que reutiliza siempre:

```text
agent:real-estate-agent:carlos
```

Para pruebas limpias usa `carlos`, no `carlos-fijo`.

## Primer Smoke Manual

Con `agent-core` y gateway activos, pregunta a Carlos:

```text
Usa search_properties con location Santo Domingo, bedrooms 3 y propertyType apartment. Presenta las propiedades encontradas.
```

Carlos debe buscar inventario real mediante la tool y no inventar propiedades.


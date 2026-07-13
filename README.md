# Real State Agent

MVP de asesor inmobiliario conversacional para Republica Dominicana. El proyecto combina un backend interno (`agent-core`), Supabase como fuente de verdad y un workspace aislado de OpenClaw para Carlos, el agente comercial.

## Estado Actual

El repositorio ya incluye:

- monorepo `pnpm` con TypeScript y ESM;
- `agent-core` con rutas internas HTTP bajo `/internal/*`;
- autenticacion Bearer para rutas internas;
- Supabase para inventario, conversaciones, leads, visitas, handoffs y eventos;
- contratos compartidos en `packages/shared`;
- workspace aislado de OpenClaw para `real-estate-agent`;
- plugin TypeScript `real-estate-tools`;
- tools visibles para Carlos: `agent_core_health`, `search_properties` y `get_property_assets`;
- skill comercial `real-estate-sales-advisor`.

OpenClaw no consulta Supabase directamente. Toda accion de negocio debe pasar por `agent-core`.

## Arquitectura

```text
Usuario
  -> Carlos / OpenClaw
  -> plugin real-estate-tools
  -> agent-core HTTP
  -> servicios y repositorios
  -> Supabase
```

## Arranque Rapido

Desde la raiz:

```bash
cd "/Users/inma/Documents/Real State Agent"
pnpm install
pnpm dev:core
```

En otra terminal, iniciar o validar el Gateway de OpenClaw:

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
./scripts/start-gateway.sh
```

Abrir Carlos con una sesion nueva:

```bash
carlos
```

Si no existe la funcion `carlos` en tu shell, usa OpenClaw directamente:

```bash
cd "/Users/inma/Documents/Real State Agent"
set -a
source .env.local
set +a
openclaw tui --session "agent:real-estate-agent:carlos-$(date +%Y%m%d%H%M%S)"
```

## Documentacion Principal

- [Getting Started](docs/getting-started.md)
- [Indice de Documentacion](docs/README.md)
- [Arquitectura](docs/architecture.md)
- [Guia de Operacion de Carlos](docs/carlos-operator-guide.md)
- [Comandos](docs/commands.md)
- [Tools y Capacidades](docs/tools-and-capabilities.md)
- [Variables de Entorno](docs/environment.md)
- [Base de Datos y Seed](docs/database-and-seed.md)
- [Testing](docs/testing.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Escenarios Funcionales](docs/functional-test-scenarios.md)

## Regla de Seguridad Principal

No poner secretos en archivos versionados. Usa `.env` o `.env.local` locales.

`AGENT_INTERNAL_API_KEY` y `OPENCLAW_AGENT_CORE_API_KEY` deben representar la misma clave funcional: la primera protege `agent-core`; la segunda es la que usa el plugin de OpenClaw para autenticarse.

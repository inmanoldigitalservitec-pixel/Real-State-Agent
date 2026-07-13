# Troubleshooting

## Carlos No Usa `search_properties`

Verifica:

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
openclaw skills check --agent real-estate-agent
openclaw skills list --agent real-estate-agent
```

Luego confirma que las tools del plugin estan disponibles para `real-estate-agent` y no para `main`.

Revisa:

- `openclaw-workspace/TOOLS.md`
- `openclaw-workspace/plugins/real-estate-tools/openclaw.plugin.json`
- `openclaw-workspace/plugins/real-estate-tools/src/index.ts`
- configuracion local de allowlist/policy de OpenClaw.

## `UNAUTHORIZED` Desde Agent Core

Causa probable: claves no coinciden.

Estas dos variables deben tener el mismo valor funcional:

```text
AGENT_INTERNAL_API_KEY
OPENCLAW_AGENT_CORE_API_KEY
```

`AGENT_INTERNAL_API_KEY` protege `/internal/*`; `OPENCLAW_AGENT_CORE_API_KEY` es lo que envia el plugin.

## Agent Core No Arranca

Comprueba:

```bash
pnpm --filter @real-estate-agent/shared build
pnpm --filter @real-estate-agent/agent-core typecheck
pnpm dev:core
```

Verifica `.env` y las variables Supabase.

## Gateway No Responde

Desde `openclaw-workspace`:

```bash
./scripts/start-gateway.sh
openclaw gateway status
openclaw health
```

El puerto esperado es `18789` con bind loopback.

## OpenClaw Falla Por SQLite Readonly En Sandbox

Algunos comandos de OpenClaw escriben en `~/.openclaw/state`. En entornos con sandbox pueden fallar con mensajes como:

```text
attempt to write a readonly database
```

No siempre indica fallo del proyecto. Repite el comando fuera del sandbox o con permisos adecuados.

## Carlos Devuelve Menos Propiedades De Las Esperadas

Revisa el flujo en este orden:

1. argumentos que envia el modelo;
2. argumentos recibidos por la tool;
3. payload enviado a `agent-core`;
4. servicio y repositorio de busqueda;
5. limite aplicado;
6. deduplicacion;
7. mapeo de resultados;
8. presentacion final del agente.

Busca patrones:

```bash
rg -n "maximum: 3|default: 3|limit: 3|Math.min|slice\\(0, 3\\)|\\.limit\\(3\\)|MAX_RESULTS|maxResults|resultLimit" apps openclaw-workspace packages
```

## Carlos No Comparte Imagenes

Confirma que:

- `get_property_assets` esta disponible para `real-estate-agent`;
- `search_properties` entrega `propertyId` interno a la tool;
- la skill `real-estate-sales-advisor` esta visible;
- la respuesta de la tool contiene enlaces JPG, PNG o PDF.

La regla comercial vive en:

```text
openclaw-workspace/skills/real-estate-sales-advisor/SKILL.md
openclaw-workspace/TOOLS.md
```


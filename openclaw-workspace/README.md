# OpenClaw Workspace

Workspace operativo del agente `real-estate-agent` y de Carlos.

## Identidad comercial

- Nombre comercial: Carlos
- Rol: asesor inmobiliario
- Idioma principal: espanol

## Ubicacion

`/Users/inma/Documents/Real State Agent/openclaw-workspace`

## Proposito

Este workspace concentra la identidad, instrucciones locales, skill comercial, scripts operativos y plugin inmobiliario de Carlos.

## Operacion basica

Abrir TUI desde este directorio:

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
openclaw tui
```

Para pruebas limpias se recomienda usar la funcion local `carlos`, que entra al repo, carga `.env.local` y abre una sesion nueva de `real-estate-agent`.

Ejecutar chequeo local:

```bash
./scripts/check-openclaw.sh
```

Iniciar Gateway:

```bash
./scripts/start-gateway.sh
```

Detener Gateway:

```bash
./scripts/stop-gateway.sh
```

## Estado actual

- workspace asociado al agente `real-estate-agent`;
- identidad comercial de Carlos;
- skill `real-estate-sales-advisor`;
- reglas operativas en `TOOLS.md`;
- plugin TypeScript `real-estate-tools`;
- tool `agent_core_health`;
- tool `search_properties`;
- tool `get_property_assets`;
- scripts seguros de operacion del gateway;
- aislamiento esperado frente a `main`.

## Tools actuales

- `agent_core_health`: verifica disponibilidad de `agent-core`.
- `search_properties`: busca inventario real via `agent-core`.
- `get_property_assets`: obtiene hasta 3 enlaces JPG, PNG o PDF asociados a una propiedad.

## Documentacion relacionada

- `../README.md`
- `../docs/getting-started.md`
- `../docs/carlos-operator-guide.md`
- `../docs/tools-and-capabilities.md`
- `TOOLS.md`
- `skills/real-estate-sales-advisor/SKILL.md`

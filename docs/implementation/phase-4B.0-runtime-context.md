# Phase 4B.0 Runtime Context

## Resultado

`CONFIRMADO`: OpenClaw local es `OpenClaw 2026.6.8 (844f405)`.

`CONFIRMADO`: `openclaw sessions --agent real-estate-agent --json --limit 5` devuelve sesiones reales para `real-estate-agent` con:

- `key`;
- `sessionId`;
- `agentId`;
- modelo;
- runtime.

`CONFIRMADO`: las trayectorias de `real-estate-agent` contienen metadata runtime por evento:

- `sessionId`;
- `sessionKey`;
- `runId`;
- `workspaceDir`;
- provider/model.

`CONFIRMADO`: la inspección runtime del plugin `real-estate-tools` muestra:

- `status: "loaded"`;
- tool actual `agent_core_health`;
- `hookNames: []`;
- `hookCount: 0`;
- `typedHooks: []`;
- `customHooks: []`.

## Campos

| Campo | Estado | Evidencia |
| --- | --- | --- |
| `agentId` | CONFIRMADO en sesiones y trayectoria | `openclaw sessions` y trayectoria local |
| `sessionId` | CONFIRMADO en sesiones y trayectoria | `openclaw sessions` y trayectoria local |
| `sessionKey` | CONFIRMADO en sesiones y trayectoria | `key`/`sessionKey` de sesiones reales |
| `toolCallId` | CONFIRMADO por SDK local del plugin | `src/openclaw-sdk.d.ts` |
| `workspaceDir` | CONFIRMADO en trayectoria | eventos runtime locales |
| `runId` | CONFIRMADO en trayectoria | eventos runtime locales |

## Estabilidad de `sessionKey`

`CONFIRMADO`: OpenClaw persiste `sessionKey` como clave estable de sesión. Ejemplos observados:

```text
agent:real-estate-agent:main
agent:real-estate-agent:tui-<uuid>
```

`INFERIDO`: `context.api.sessionKey` dentro de `execute()` debe corresponder a esa metadata runtime. El plugin ya usa extracción defensiva desde `context.api`, `runContext` y `toolContext`.

`NO CONFIRMADO DIRECTAMENTE`: en este turno no se agregó una tool temporal ni se ejecutó una llamada real de `agent_core_health` instrumentada para imprimir el shape de `context.api`; por tanto, la presencia de `sessionKey` dentro del objeto `ToolPluginExecutionContext` queda como inferida desde runtime/trajectory y las notas 4A, no observada por instrumentación nueva.

## Hooks

`CONFIRMADO`: `real-estate-tools` no expone hooks en runtime (`hookNames: []`, `hookCount: 0`).

`NO ENCONTRADO`: hook estable `before agent run`, `before tool call`, `after tool call`, `after assistant response`, `after run` o `final response event` dentro del plugin actual.

## Decisión

`FASE 4B.0 BLOQUEADA` para el requisito de persistir automáticamente la respuesta final del asistente sin depender del modelo.

El backend y los métodos internos del plugin pueden quedar preparados, pero hace falta una de estas piezas antes de declarar completitud:

1. hook oficial de respuesta final en OpenClaw;
2. wrapper de runtime que observe user message y assistant final;
3. endpoint de turno usado por una capa orquestadora que reciba ambos textos de forma confiable.

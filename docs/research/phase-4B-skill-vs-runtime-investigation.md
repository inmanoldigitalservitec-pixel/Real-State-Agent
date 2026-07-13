# Phase 4B - Skill vs Runtime Investigation

## 1. Resumen ejecutivo

`CONFIRMADO / BLOQUEANTE`: `search_properties` esta registrada en el plugin, pero no llega como tool efectiva al modelo de `real-estate-agent`. La causa principal no es falta de skill: la policy global `tools.profile: "coding"` remueve `search_properties` en cada ejecucion.

`CONFIRMADO`: `openclaw plugins inspect real-estate-tools --runtime --json` muestra `toolNames: ["agent_core_health", "search_properties"]`.

`CONFIRMADO`: el prompt efectivo de sesiones reales y nuevas incluye `agent_core_health` en "Deferred searchable OpenClaw dynamic tools available", pero no incluye `search_properties`.

`CONFIRMADO`: logs recientes dicen literalmente que `tools.profile (coding)` removio `search_properties`.

`CONFIRMADO`: en `~/.openclaw/openclaw.json`, `real-estate-agent.tools.alsoAllow` contiene solo `agent_core_health`; no contiene `search_properties`.

`DECISION FINAL`: DECISION A: NO HACE FALTA SKILL - EL PROBLEMA ES POLICY/CONFIGURACION.

## 2. Tool efectiva

| Punto | Estado | Evidencia | Bloqueante | Accion |
|---|---|---|---|---|
| Plugin registra `search_properties` | CONFIRMADO | `openclaw-workspace/plugins/real-estate-tools/src/index.ts:32-43`; `openclaw.plugin.json:50-54`; `plugins inspect` lista `agent_core_health`, `search_properties` | NO BLOQUEANTE | Mantener |
| Tool sobrevive al perfil efectivo | CONFIRMADO que no sobrevive | Logs: `tool policy removed ... search_properties` por `tools.profile (coding)` | BLOQUEANTE | Agregar permiso efectivo para `search_properties` o cambiar perfil |
| Tool llega al modelo | CONFIRMADO que no llega | `systemPromptReport.tools.entries` en pruebas A/B/C no contiene `search_properties`; lista diferida solo incluye `agent_core_health` y tools generales | BLOQUEANTE | Corregir policy antes de skill |
| Disponible para `main` | NO ENCONTRADO / INFERIDO que no | Prompt de `main` existente no lista `agent_core_health` ni `search_properties`; config de `main` deniega `agent_core_health`; perfil global remueve `search_properties` | NO BLOQUEANTE | Mantener aislamiento |

Evidencia de runtime:

- `openclaw plugins inspect real-estate-tools --runtime --json`: `status: "loaded"`, `toolNames: ["agent_core_health", "search_properties"]`.
- Trajectory de `agent:real-estate-agent:carlos-20260712183820`: deferred tools = `agent_core_health, create_goal, cron, ... web_search`; `search_properties` no esta en la lista efectiva.
- Prueba C con prompt explicito: respuesta final "la herramienta `search_properties` no esta disponible en esta sesion".

## 3. Policy efectiva

`CONFIRMADO / BLOQUEANTE`: la policy efectiva remueve `search_properties`.

Evidencia de logs:

```text
tool policy removed 25 tool(s) via tools.profile (coding): ... search_properties ...
```

La remocion aparece repetidamente en los logs para ejecuciones de `real-estate-agent`, incluidas las pruebas nuevas A/B/C.

`CONFIRMADO`: `~/.openclaw/openclaw.json` tiene:

```json
"tools": { "profile": "coding" }
```

`CONFIRMADO`: para `real-estate-agent`, la configuracion de agente tiene:

```json
"tools": { "alsoAllow": ["agent_core_health"] }
```

`INFERIDO`: `agent_core_health` llega al modelo porque fue agregado en `alsoAllow`, mientras que `search_properties` no llega porque no esta en `alsoAllow` y el perfil `coding` lo filtra.

## 4. Configuracion del agente

Configuracion saneada de `real-estate-agent`:

- `workspace`: `/Users/inma/Documents/Real State Agent/openclaw-workspace`
- `agentDir`: `/Users/inma/.openclaw/agents/real-estate-agent/agent`
- `model`: `openai/gpt-5.5`
- `tools.profile`: heredado global `coding`
- `tools.allow`: NO ENCONTRADO
- `tools.alsoAllow`: `["agent_core_health"]`
- `tools.deny`: NO ENCONTRADO en el agente
- `sandbox`: NO ENCONTRADO en el agente
- `skills`: NO ENCONTRADO en el agente
- `plugin access`: plugin `real-estate-tools` habilitado, cargado desde `openclaw-workspace/plugins/real-estate-tools`

`CONFIRMADO`: `agents.list[].skills` no existe para `real-estate-agent`.

`CONFIRMADO`: no es `[]`; esta ausente.

`CONFIRMADO`: no contiene skills inmobiliarias.

`INFERIDO`: al estar ausente, no hay allowlist de skills por agente; lo confirma `openclaw skills check --agent real-estate-agent`: `Excluded by agent allowlist: 0`.

## 5. Workspace efectivo

`CONFIRMADO`: Carlos usa exactamente `/Users/inma/Documents/Real State Agent/openclaw-workspace`.

Evidencia:

- `openclaw agents list`: `real-estate-agent` tiene workspace `~/Documents/Real State Agent/openclaw-workspace`.
- `systemPromptReport.workspaceDir`: `/Users/inma/Documents/Real State Agent/openclaw-workspace`.
- Las pruebas A/B/C inyectaron `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` desde ese workspace.

Archivos revisados:

- `openclaw-workspace/AGENTS.md`
- `openclaw-workspace/TOOLS.md`
- `openclaw-workspace/SOUL.md`
- `openclaw-workspace/IDENTITY.md`
- `openclaw-workspace/USER.md`

`CONFIRMADO`: no existe `openclaw-workspace/skills/` ni `openclaw-workspace/.agents/skills/`.

## 6. Skills existentes

`CONFIRMADO`: `openclaw skills --help` en OpenClaw 2026.6.11 expone `check`, `info`, `install`, `list`, `search`, `update`, `verify`, `workshop`.

`CONFIRMADO`: `openclaw skills check --agent real-estate-agent`:

- `Total: 54`
- `Eligible: 21`
- `Visible to model: 21`
- `Disabled: 33`
- `Blocked by allowlist: 0`
- `Excluded by agent allowlist: 0`

`NO ENCONTRADO`: skill inmobiliaria existente.

`NO ENCONTRADO`: una skill existente que interfiera directamente con inventario inmobiliario.

`CONFIRMADO`: `main` y `real-estate-agent` ven las mismas 21 skills generales.

`NO ENCONTRADO`: una allowlist de skills que bloquee a Carlos.

`INFERIDO`: una nueva skill podria asignarse solo a Carlos mediante `agents.list[].skills`, pero no se recomienda hasta resolver la policy de tools.

## 7. Semantica de `agents.list[].skills`

`CONFIRMADO`: el schema instalado contiene `skills: array(string()).optional()` en configuraciones relevantes. Evidencia local: `/Users/inma/.npm-global/lib/node_modules/openclaw/dist/config-schema-CO63ymx7.js:156`.

`CONFIRMADO`: el CLI de skills describe agent allowlists:

- `openclaw skills check`: muestra `Excluded by agent allowlist`.
- `clawhub/SKILL.md:62-64`: installs compartidas son visibles para agentes locales "unless agent allowlists narrow them".

`CONFIRMADO`: para `real-estate-agent`, `agents.list[].skills` esta ausente, no vacio.

`INFERIDO`: ausente significa "no narrowing por allowlist de agente"; no reemplaza las skills por defecto.

`INFERIDO`: una lista no vacia actua como allowlist/restriccion. Si fuera `[]`, probablemente excluiria todas las skills elegibles por agente, pero esta hipotesis no aplica al estado actual porque el valor no existe.

## 8. Como se cargan `SKILL.md`

`CONFIRMADO`: el prompt efectivo recibe metadata de skills, no el cuerpo completo. En `systemPromptReport.skills.entries` aparecen nombres y tamanos de bloque; el prompt incluye `<available_skills>` con `name`, `description`, `location`, `version`.

`CONFIRMADO`: el prompt del runtime dice:

```text
Use the read tool to load a skill's file when the task matches its description.
```

`CONFIRMADO`: el skill local `skill-creator` dice que la metadata siempre esta visible y el cuerpo carga solo despues del trigger. Evidencia: `/Users/inma/.npm-global/lib/node_modules/openclaw/skills/skill-creator/SKILL.md:8`.

`INFERIDO`: el modelo debe leer `SKILL.md` bajo demanda cuando la descripcion dispara la skill.

`NO ENCONTRADO`: evidencia de que el contenido completo de `SKILL.md` se cargue automaticamente antes del trigger.

`INFERIDO`: una skill seria insuficiente si la tool `search_properties` sigue bloqueada por policy; podria ensenar la regla, pero no haria invocable una tool ausente.

`CONFIRMADO`: logs muestran `skills snapshot invalidated by config change (skills)`; por tanto hay snapshot/cache de skills y se invalida ante cambios de config.

`INFERIDO`: una skill nueva o modificada se refresca en nuevos turnos o tras invalidacion/reload; no se comprobo porque no se modificaron archivos.

## 9. Descripcion de `search_properties`

Definicion:

- Nombre: `search_properties` (`src/index.ts:32-33`)
- Label: `Search Properties` (`src/index.ts:34`)
- Descripcion: `searchPropertiesDescription` (`src/index.ts:35`)
- Schema: `searchPropertiesParamsSchema` (`src/index.ts:36`)

Descripcion actual:

```text
Search real inventory through agent-core when the customer asks for property options.
Use remembered preferences from the conversation and ask one clarifying question only when the search would be too ambiguous.
Return at most 3 options, do not invent properties, and do not expose technical ids to the customer.
Do not use this tool to confirm a specific unit; availableUnits is only a general count.
```

Campos visibles opcionales:

- `location`
- `sector`
- `city`
- `bedrooms`
- `bathrooms`
- `parkingSpaces`
- `minimumPrice`
- `maximumPrice`
- `currency`
- `propertyType`
- `amenities`
- `availability`
- `limit`

Campos obligatorios: ninguno.

Ejemplos en definicion de tool: `NO ENCONTRADO`.

Reglas de uso: inventario real, memoria, maximo 3, no inventar, no IDs tecnicos, no disponibilidad de unidad.

Evaluacion:

- `CONFIRMADO`: ubicacion + habitaciones son suficientes tecnicamente; smoke real con `location: "Santo Domingo"`, `bedrooms: 3`, `propertyType: "apartment"`, `limit: 3` devolvio 2 resultados.
- `CONFIRMADO`: la descripcion no obliga a pedir presupuesto.
- `CONFIRMADO`: indica reutilizar memoria.
- `CONFIRMADO`: dice "Search real inventory".
- `NO ENCONTRADO`: no dice explicitamente "no digas que careces de inventario".
- `INFERIDO`: el schema con todos los campos opcionales no deberia impedir llamada; el bloqueo ocurre antes, por policy.
- `INFERIDO`: `propertyType` debe inferirse de "apartamento" como `apartment`; la descripcion no lo ejemplifica.

`RECOMENDACION / NO BLOQUEANTE`: mejorar la descripcion puede aumentar confiabilidad una vez la tool llegue al modelo, pero no soluciona el bloqueo actual.

## 10. Instrucciones contradictorias

`CONFIRMADO`: `openclaw-workspace/TOOLS.md:14` instruye usar `search_properties` cuando el cliente pida opciones de inmuebles.

`CONFIRMADO`: `openclaw-workspace/TOOLS.md:16` permite una aclaracion solo cuando falten datos importantes.

`CONFIRMADO`: `openclaw-workspace/AGENTS.md:17-22` y `SOUL.md:20-25` prohiben inventar disponibilidad o resultados.

`INFERIDO`: cuando la tool no esta disponible, esas reglas prudentes empujan a Carlos a pedir zona/presupuesto o decir que no puede consultar inventario. Esto es comportamiento razonable bajo toolset incompleto.

`NO ENCONTRADO`: instruccion vigente en workspace que diga "no hay tools inmobiliarias", "la busqueda todavia no esta conectada", o "siempre pedir presupuesto antes de buscar".

Nota: `docs/research/phase-4B-search-readiness.md:373` registra una contradiccion historica de `TOOLS.md`, pero el archivo actual ya fue corregido.

## 11. Analisis de sesion antigua

Sesion investigada: `agent:real-estate-agent:carlos-20260712183820`.

`CONFIRMADO`: sessionId `5c7fa9c7-9f5e-4baa-96ad-a3b172164a99`.

`CONFIRMADO`: creada/actualizada en 2026-07-12T22:38:36Z - 22:41:12Z.

`CONFIRMADO`: la trayectoria compilo contexto en varios turnos y siempre omitio `search_properties` de deferred tools.

`CONFIRMADO`: historial contiene:

- Usuario: "busco un apartamento de 3 habitaciones"
- Carlos: "¿En que zona o ciudad...?"
- Carlos: "¿que presupuesto aproximado...?"
- Carlos: "no puedo confirmar opciones reales de inventario..."

`CONFIRMADO`: Carlos leyo archivos donde aparecia `search_properties`, incluyendo `TOOLS.md` y codigo de la tool, pero aun asi no la pudo invocar como tool.

`INFERIDO`: el historial antiguo condiciona el estilo de pedir aclaraciones, pero no es la causa primaria porque sesiones nuevas tambien carecen de `search_properties`.

`CONFIRMADO`: el toolset se recalcula en nuevos turnos/sesiones; pruebas A/B/C tuvieron `systemPromptReport` nuevo y aun asi no incluyeron `search_properties`.

## 12. Pruebas A/B/C

Todas se ejecutaron con `openclaw agent --agent real-estate-agent --session-key ... --json --timeout 240`.

### Prueba A

Prompt:

```text
Busco un apartamento de 3 habitaciones en Santo Domingo.
```

Resultado:

- Toolset efectivo: no incluye `search_properties`.
- Tool llamada: ninguna inmobiliaria.
- Respuesta final: pide presupuesto aproximado.
- Interpretacion: falla natural porque la tool no llega al modelo.

### Prueba B

Prompt:

```text
Consulta el inventario real usando la herramienta de busqueda para apartamentos de 3 habitaciones en Santo Domingo.
```

Resultado:

- Toolset efectivo: no incluye `search_properties`.
- Tool llamada: `agent_core_health` y `bash`, no `search_properties`.
- Respuesta final muestra 2 propiedades reales, pero las obtuvo por inspeccion/ejecucion via shell, no por la tool del plugin.
- Interpretacion: B no demuestra que `search_properties` llegue al modelo; demuestra que el modelo puede intentar rodear la ausencia con herramientas de codigo/shell.

### Prueba C

Prompt:

```text
Usa search_properties con location Santo Domingo, bedrooms 3 y propertyType apartment.
```

Resultado:

- Toolset efectivo: no incluye `search_properties`.
- Tool llamada: `agent_core_health`.
- Respuesta final: "la herramienta `search_properties` no esta disponible en esta sesion".
- Interpretacion: confirmacion directa de tool ausente.

## 13. Clasificacion exacta del fallo

| Causa posible | Estado | Evidencia | Bloqueante | Accion |
|---|---|---|---|---|
| A. La tool no llega realmente al modelo | CONFIRMADO | Toolset efectivo en systemPromptReport no lista `search_properties` | SI | Corregir policy/config |
| B. La tool llega, pero una policy la bloquea | CONFIRMADO parcialmente | El bloqueo ocurre antes de llegar al modelo: `tools.profile (coding)` la remueve | SI | Agregar allow efectivo |
| C. La tool llega, pero la descripcion no es suficiente | NO ENCONTRADO | La tool no llega; no se puede evaluar comportamiento con descripcion | NO | Revaluar despues de policy |
| D. Instrucciones contradicen inventario | NO ENCONTRADO como causa primaria | `TOOLS.md` actual ordena usar `search_properties` | NO | Mantener, quizas reforzar |
| E. Sesion conserva contexto anterior | INFERIDO como secundario | Sesion antigua tiene respuestas de no-inventario, pero sesiones nuevas tambien fallan | NO | Usar sesion limpia despues de fix |
| F. Falta una skill formal | NO ENCONTRADO como causa primaria | Sin tool efectiva, skill no basta | NO | Considerar luego |
| G. Skill existe, pero deshabilitada | NO ENCONTRADO | No existe skill inmobiliaria | NO | No aplica |
| H. Modelo recibe skill, pero no lee SKILL.md | NO ENCONTRADO | No existe skill inmobiliaria; skills se cargan por metadata y lectura bajo demanda | NO | No aplica |
| I. Otra causa | CONFIRMADO secundaria | `tools.alsoAllow` solo contiene `agent_core_health`; perfil global `coding` filtra `search_properties` | SI | Cambiar config/policy |

## 14. Skill necesaria o no

`RECOMENDACION`: no crear skill todavia.

Razon:

1. `CONFIRMADO`: la tool no llega al modelo.
2. `CONFIRMADO`: la policy la remueve.
3. `CONFIRMADO`: `TOOLS.md` ya instruye usarla.
4. `INFERIDO`: una skill podria mejorar comportamiento multi-turn despues, pero no arregla una tool ausente.

## 15. Diseno hipotetico de skill

`NO APLICA EN ESTA DECISION`: la evidencia no indica que haga falta una skill para resolver el bloqueo actual.

Si despues de corregir policy la Prueba A siguiera fallando mientras B/C funcionan con `search_properties`, entonces si tendria sentido una skill minima:

- Nombre: `real-estate-search`
- Ubicacion: `openclaw-workspace/skills/real-estate-search/SKILL.md`
- Frontmatter:

```yaml
---
name: real-estate-search
description: "Use search_properties for real estate inventory searches when buyers ask for property options."
---
```

Instrucciones hipoteticas:

- Usar `search_properties` cuando el cliente pida opciones de propiedades.
- Inferir `apartment` desde "apartamento".
- No pedir presupuesto si ya hay ubicacion + tipo/habitaciones suficientes.
- Maximo 3 propiedades.
- Una pregunta por turno.
- No inventar resultados.
- Usar memoria conversacional.
- Tratar `availableUnits` como conteo general, no disponibilidad especifica.
- Con cero resultados, explicar y pedir una sola alternativa.

Cambio minimo hipotetico en `agents.list[].skills`: agregar allowlist que incluya `real-estate-search` solo si se quiere aislarla para Carlos. No implementado.

## 16. Cambios minimos recomendados

`RECOMENDACION / BLOQUEANTE`: corregir policy/config para que `search_properties` sobreviva al perfil efectivo.

Opciones conceptuales, sin aplicar:

1. Agregar `search_properties` a `agents.list[].tools.alsoAllow` de `real-estate-agent`.
2. Revisar si `tools.profile: "coding"` es apropiado para un agente comercial.
3. Mantener `main` sin `search_properties`.
4. Repetir Pruebas A/B/C en sesiones nuevas.
5. Solo si A falla pero B/C llaman correctamente la tool, mejorar descripcion o crear skill minima.

## 17. Riesgos

- `BLOQUEANTE`: mientras `search_properties` siga filtrada, Carlos no puede usar inventario real aunque el plugin funcione.
- `NO BLOQUEANTE`: la sesion antigua contiene historial de "no puedo confirmar inventario"; usar sesiones limpias despues del fix.
- `NO BLOQUEANTE`: B demostro que el agente puede rodear la falta de tool con shell si el harness lo permite; esto no es el flujo comercial deseado.
- `NO BLOQUEANTE`: falta ejemplo de tool description para mapear "apartamento" a `propertyType: "apartment"`.

## 18. Archivos potencialmente afectados

No se modificaron en esta investigacion. Potenciales cambios futuros:

- `~/.openclaw/openclaw.json`: agregar `search_properties` a `real-estate-agent.tools.alsoAllow` o ajustar perfil.
- `openclaw-workspace/TOOLS.md`: opcional, reforzar que ubicacion + habitaciones + tipo bastan.
- `openclaw-workspace/plugins/real-estate-tools/src/tools/search-properties.ts`: opcional, mejorar descripcion con ejemplo.
- `openclaw-workspace/skills/real-estate-search/SKILL.md`: solo si despues de corregir policy falta instruccion formal.

## 19. Evidencias con archivos y lineas

- `openclaw-workspace/plugins/real-estate-tools/src/index.ts:32-43`: registro de `search_properties`.
- `openclaw-workspace/plugins/real-estate-tools/openclaw.plugin.json:50-54`: contrato declara `agent_core_health` y `search_properties`.
- `openclaw-workspace/plugins/real-estate-tools/src/tools/search-properties.ts:71-97`: schema visible cerrado.
- `openclaw-workspace/plugins/real-estate-tools/src/tools/search-properties.ts:99-104`: descripcion de la tool.
- `openclaw-workspace/plugins/real-estate-tools/src/tools/search-properties.ts:147-159`: llamada a `agent-core` con filtros aplicados.
- `openclaw-workspace/TOOLS.md:5-8`: workspace declara ambas tools.
- `openclaw-workspace/TOOLS.md:14-20`: reglas para usar `search_properties`.
- `openclaw-workspace/AGENTS.md:17-22`: no inventar propiedades ni disponibilidad.
- `openclaw-workspace/SOUL.md:20-25`: evitar inventar resultados/verificaciones.
- `/Users/inma/.npm-global/lib/node_modules/openclaw/skills/skill-creator/SKILL.md:8`: metadata visible, cuerpo de skill bajo trigger.
- `/Users/inma/.npm-global/lib/node_modules/openclaw/skills/clawhub/SKILL.md:62-64`: skills compartidas visibles salvo allowlists de agente.
- `/Users/inma/.npm-global/lib/node_modules/openclaw/dist/config-schema-CO63ymx7.js:156`: `skills` como array opcional.

Evidencias de comandos:

- `openclaw plugins inspect real-estate-tools --runtime --json`: plugin cargado con ambas tools.
- `openclaw logs --plain ...`: `tool policy removed ... search_properties`.
- `openclaw skills check --agent real-estate-agent`: 21 skills visibles, 0 excluidas por allowlist de agente.
- `openclaw agent ... investigation-c ...`: respuesta final confirma tool no disponible.

## 20. Comandos ejecutados

Solo lectura salvo las pruebas de conversacion solicitadas:

```bash
openclaw skills --help
openclaw plugins --help
openclaw sessions --help
openclaw logs --help
openclaw plugins inspect real-estate-tools --runtime --json
openclaw skills list --agent real-estate-agent
openclaw skills list --agent main
openclaw skills check --agent real-estate-agent
openclaw skills check --agent main
openclaw sessions --agent real-estate-agent --json --limit 50
openclaw sessions --agent main --json --limit 5
openclaw logs --plain --limit 300 --timeout 10000
openclaw logs --plain --limit 120 --timeout 10000
openclaw agent --agent real-estate-agent --session-key agent:real-estate-agent:investigation-a-20260712 --message "Busco un apartamento de 3 habitaciones en Santo Domingo." --json --timeout 240
openclaw agent --agent real-estate-agent --session-key agent:real-estate-agent:investigation-b-20260712 --message "Consulta el inventario real usando la herramienta de busqueda para apartamentos de 3 habitaciones en Santo Domingo." --json --timeout 240
openclaw agent --agent real-estate-agent --session-key agent:real-estate-agent:investigation-c-20260712 --message "Usa search_properties con location Santo Domingo, bedrooms 3 y propertyType apartment." --json --timeout 240
rg -n "search_properties|inventario|disponibilidad|presupuesto|Fase 4|no puedo confirmar|no hay herramientas|Santo Domingo|preguntar zona|preguntar presupuesto" ...
find openclaw-workspace -maxdepth 4 -type f ...
nl -ba openclaw-workspace/AGENTS.md
nl -ba openclaw-workspace/TOOLS.md
nl -ba openclaw-workspace/SOUL.md
nl -ba openclaw-workspace/IDENTITY.md
nl -ba openclaw-workspace/USER.md
nl -ba openclaw-workspace/plugins/real-estate-tools/src/tools/search-properties.ts
nl -ba openclaw-workspace/plugins/real-estate-tools/src/index.ts
nl -ba openclaw-workspace/plugins/real-estate-tools/openclaw.plugin.json
```

## 21. Decision final

DECISION A: NO HACE FALTA SKILL - EL PROBLEMA ES POLICY/CONFIGURACION.

# OpenClaw Local Readiness

## 1. Resumen ejecutivo

- `CONFIRMADO`: el repositorio ya no está en estado de scaffold puro. `agent-core` expone una API HTTP interna con rutas de catálogo, contexto conversacional, mensajes, leads, visitas y handoffs, y además existe persistencia real en Supabase y tests/smoke tests asociados. Evidencia: `AGENTS.md:16-30`, `apps/agent-core/src/app.ts:46-58`, `apps/agent-core/src/routes/internal/index.ts:13-18`, `supabase/README.md:15-21`.
- `CONFIRMADO`: la documentación guía del repo quedó atrasada respecto al código real. `AGENTS.md` todavía dice “Do not add Supabase, OpenClaw or business tools until explicitly requested”, pero el repo ya incluye schema, seed, servicios, repositorios y contratos compartidos. Evidencia: `AGENTS.md:18-30`, `supabase/README.md:3-4`, `apps/agent-core/package.json` scripts observados, `packages/shared/src/index.ts:116-176`, `apps/agent-core/src/services/conversation.service.ts:28-238`.
- `CONFIRMADO`: la parte OpenClaw dentro del repo todavía no comenzó para este proyecto. `openclaw-workspace/` sigue siendo un placeholder sin skills, tools ni configuración inmobiliaria. Evidencia: `openclaw-workspace/README.md:1-7`.
- `CONFIRMADO`: la instalación local de OpenClaw existe, pero su workspace activo por defecto no corresponde a este proyecto sino a “Corevix CRM”. Evidencia: configuración local inspeccionada y `~/.openclaw/workspace/USER.md:1-25`, `~/.openclaw/workspace/IDENTITY.md:1-24`.
- `BLOQUEANTE`: el gateway local no está operativo. `openclaw gateway status` reportó LaunchAgent instalado pero no cargado y `openclaw health --json` devolvió `gateway_transport_error` con `ws://127.0.0.1:18789`.
- `BLOQUEANTE`: la autenticación/configuración de proveedor OpenAI local no está sana para uso inmediato; `openclaw models status --json` mostró `missingProvidersInUse: openai` y perfiles OAuth expirados.
- `NO BLOQUEANTE`: los contratos HTTP y la persistencia del proyecto ya cubren casi todas las futuras tools oficiales del MVP salvo `compare_properties`.
- `INFERIDO`: el proyecto está bien encaminado en backend y datos para entrar a Fase 4A, pero todavía fuera de camino en la capa OpenClaw local porque no existe un workspace inmobiliario conectado ni un gateway sano apuntando a este repo.

## 2. Alcance y limitaciones

- `CONFIRMADO`: esta investigación fue solo de lectura sobre repositorio, archivos locales, instalación local de OpenClaw, salidas de `help`, configuración y procesos.
- `CONFIRMADO`: no se modificaron archivos existentes, no se instalaron paquetes, no se ejecutaron migraciones, no se escribieron datos en Supabase y no se cambiaron configuraciones de OpenClaw.
- `CONFIRMADO`: no se mostraron secretos ni contenidos de `.env`; solo se mencionan nombres de variables.
- `LIMITACIÓN`: algunas inspecciones del CLI de OpenClaw disparan intentos de hardening o acceso a SQLite local y devolvieron errores de permisos/readonly dentro del sandbox.
- `LIMITACIÓN`: `ps` y `lsof` requirieron inspección fuera del sandbox. `ps` funcionó con permiso; `lsof` no mostró listeners relevantes.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: nada en este informe afirma qué patrón es “oficial” para tools, skills, allowlists o prioridad de instrucciones.

## 3. Estado del repositorio

- `CONFIRMADO`: monorepo `pnpm` con `apps/*` y `packages/*`. Evidencia: `package.json:1-14`, `pnpm-workspace.yaml:1-5`.
- `CONFIRMADO`: scripts raíz reales: `dev`, `dev:core`, `dev:web`, `build`, `typecheck`, `clean`. Evidencia: `package.json:6-13`.
- `CONFIRMADO`: `apps/agent-core` ya no es “future agent logic” solamente; tiene build, typecheck, unit tests, integration tests y dos smoke tests (`smoke:supabase`, `smoke:internal-api`). Evidencia observada en `apps/agent-core/package.json`.
- `CONFIRMADO`: `apps/web-chat` sigue siendo una UI de scaffold técnico que solo consulta `/health`. Evidencia: `apps/web-chat/src/App.tsx:13-49`.
- `CONFIRMADO`: `packages/shared` contiene contratos de dominio reales, no solo helpers mínimos. Evidencia: `packages/shared/src/index.ts:116-620`.
- `CONFIRMADO`: `docs/` contiene guías funcionales del producto: `sales-flow`, `conversation-guide`, `memory-map`, `tool-map`, `asset-strategy`, `objection-handling`, `conversation-scenarios`.
- `CONFIRMADO`: `.env.example` ya prevé integración futura con `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `OPENCLAW_BASE_URL`. Evidencia: `.env.example:11-15`.
- `CONFIRMADO`: `.gitignore` protege `.env` y variantes, dejando solo `.env.example` trackeado. Evidencia: `.gitignore:4-12`.
- `NO ENCONTRADO`: dentro del repo no hay implementación real de tool registry, allowlist, skills de OpenClaw, sesiones o gateway config específico del proyecto.

## 4. Estado de `agent-core`

- `CONFIRMADO`: `/health` sin auth y `/internal/*` protegido con Bearer token. Evidencia: `apps/agent-core/src/app.ts:51-58`, `apps/agent-core/src/middleware/internal-auth.ts:4-23`.
- `CONFIRMADO`: límites operativos ya definidos para API interna: body limit 32 KB y timeout 10 s. Evidencia: `apps/agent-core/src/app.ts:55-57`.
- `CONFIRMADO`: formato de éxito `{ success: true, data, metadata.verifiedAt }`. Evidencia: `apps/agent-core/src/routes/internal/helpers.ts:26-35`, `packages/shared/src/index.ts:168-184`.
- `CONFIRMADO`: formato de error `{ success: false, error: { code, message, retryable, requiresClarification, requiresHuman } }`. Evidencia: `packages/shared/src/index.ts:155-166`, `apps/agent-core/src/middleware/error-handler.ts:20-30`.
- `CONFIRMADO`: mapeo de errores implementado para `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `DATABASE_ERROR`, más `UNEXPECTED_ERROR`. Evidencia: `apps/agent-core/src/middleware/error-handler.ts:33-108`.
- `CONFIRMADO`: el backend ya implementa idempotencia para mensajes (`clientMessageId`), visitas (`idempotencyKey`) y handoffs (`idempotencyKey` + detección de duplicado por payload). Evidencia: `apps/agent-core/src/services/conversation.service.ts:191-207`, `apps/agent-core/src/services/visit.service.ts:22-46`, `apps/agent-core/src/services/human-handoff.service.ts:41-84`.
- `INFERIDO`: `agent-core` está bastante avanzado para Fase 4A porque la capa HTTP a OpenClaw parece ser el hueco principal, no la lógica de negocio.

## 5. Contratos HTTP disponibles

- `CONFIRMADO`: rutas implementadas:
  - `POST /internal/properties/resolve-reference`
  - `POST /internal/properties/search`
  - `GET /internal/properties/:propertyId`
  - `GET /internal/properties/:propertyId/availability`
  - `POST /internal/properties/:propertyId/media`
  - `POST /internal/properties/:propertyId/documents`
  - `GET /internal/properties/:propertyId/payment-plan`
  - `GET /internal/companies/:companyId/information`
  - `GET /internal/conversations/:conversationId/context`
  - `PATCH /internal/conversations/:conversationId/state`
  - `POST /internal/conversations/:conversationId/messages`
  - `POST /internal/leads`
  - `POST /internal/visits`
  - `POST /internal/handoffs`
- `CONFIRMADO`: `companyId`, `conversationId`, `propertyId` y `listingId` ya aparecen en los schemas compartidos según cada caso de uso. Evidencia: `packages/shared/src/index.ts:136-151`, `packages/shared/src/index.ts:194-206`, `packages/shared/src/index.ts:477-580`, y schemas observados de lead/visit/handoff.
- `CONFIRMADO`: flags de error reutilizables ya existen y son aptos para futuras tools de OpenClaw: `retryable`, `requiresClarification`, `requiresHuman`.
- `CONFIRMADO`: los contratos compartidos reutilizables ya cubren búsqueda, resolución de referencia, detalle, disponibilidad, media, documentos, payment plan, company info, contexto conversacional, patch de estado, guardado de mensajes, captura de lead, request de visita y handoff.
- `NO ENCONTRADO`: contrato HTTP para `compare_properties`.

## 6. Persistencia conversacional existente

- `CONFIRMADO`: el endpoint de contexto es `GET /internal/conversations/:conversationId/context`. Evidencia: `apps/agent-core/src/routes/internal/conversations.ts:20-25`.
- `CONFIRMADO`: el endpoint que modifica estado/memoria estructurada es `PATCH /internal/conversations/:conversationId/state`. Evidencia: `apps/agent-core/src/routes/internal/conversations.ts:28-33`.
- `CONFIRMADO`: el endpoint que guarda mensajes es `POST /internal/conversations/:conversationId/messages`. Evidencia: `apps/agent-core/src/routes/internal/conversations.ts:36-45`.
- `CONFIRMADO`: no vi una operación atómica única para “guardar un turno completo” que combine memoria, mensaje, lead/evento/visita en una sola transacción pública.
- `CONFIRMADO`: la memoria implementada en código incluye identidad, preferencias, contexto comercial, propiedad activa, listas de propiedades, assets enviados, resumen, pregunta pendiente, visita, handoff y `memoryVersion`. Evidencia: `packages/shared/src/index.ts:479-528`, `apps/agent-core/src/services/conversation.service.ts:42-92`.
- `INFERIDO`: `activePropertyUnitId` está implementado en memoria aunque no figura de forma explícita en el bloque principal de “Propiedades” del `memory-map.md`.
- `CONFIRMADO`: `conversationContextResult` expone `sourcePropertyUnitId`, pero `conversationMemorySchema` no incluye `sourcePropertyUnitId`; solo `sourcePropertyId` y `sourceListingId`. Evidencia: `packages/shared/src/index.ts:518-520`, `packages/shared/src/index.ts:584-603`.
- `CONFIRMADO`: el patch de estado incrementa `memory_version` y también actualiza campos top-level de `conversations`. Evidencia: `apps/agent-core/src/services/conversation.service.ts:117-172`.
- `CONFIRMADO`: `saveMessage` actualiza `last_message_at` y opcionalmente `current_sales_stage` en `conversations`. Evidencia: `apps/agent-core/src/services/conversation.service.ts:209-225`.
- `CONFIRMADO`: `captureLead`, `requestVisit` y `requestHumanHandoff` ya escriben en tablas de conversión/eventos y propagan `runId` de testing si existe. Evidencia: `apps/agent-core/src/services/lead.service.ts:21-66`, `apps/agent-core/src/services/visit.service.ts:48-68`, `apps/agent-core/src/services/human-handoff.service.ts:184-203`.
- `INFERIDO`: con los endpoints actuales sí puede guardarse un turno completo de OpenClaw, pero hoy requeriría varias llamadas coordinadas desde la capa OpenClaw en vez de una sola operación backend.

## 7. Estado de `openclaw-workspace`

- `CONFIRMADO`: `openclaw-workspace/` del repo solo contiene un README placeholder. Evidencia: `openclaw-workspace/README.md:1-7`.
- `NO ENCONTRADO`: skills inmobiliarias dentro del repo.
- `NO ENCONTRADO`: tools de OpenClaw implementadas dentro del repo.
- `NO ENCONTRADO`: configuración de agentes, modelos, memoria o sesiones de OpenClaw específica del repo.
- `CONFIRMADO`: la guía del repo todavía presenta este directorio como “reserved for future OpenClaw files and skills”. Evidencia: `AGENTS.md:12-13`.
- `BLOQUEANTE`: para Fase 4A todavía no existe un workspace OpenClaw del agente inmobiliario dentro del repo.

## 8. Inventario de la instalación local de OpenClaw

- `CONFIRMADO`: binario detectado en `/Users/inma/.npm-global/bin/openclaw`.
- `CONFIRMADO`: versión instalada `OpenClaw 2026.6.8 (844f405)`.
- `INFERIDO`: el método de instalación aparente es global vía npm, por la ruta bajo `~/.npm-global`.
- `CONFIRMADO`: existe estructura local amplia en `~/.openclaw`: `agents`, `state`, `memory`, `logs`, `extensions`, `plugin-skills`, `service-env`, `workspace`, `devices`, `sessions`.
- `CONFIRMADO`: existe gran cantidad de sesiones persistidas bajo `~/.openclaw/agents/main/sessions/`.
- `CONFIRMADO`: existen bases SQLite locales de estado/memoria del agente.
- `CONFIRMADO`: existen plugins/extensiones locales instalados como `openclaw-macos-control-center` y `openclaw-test-tool-plugin`.
- `CONFIRMADO`: existe `plugin-skills/browser-automation`.

## 9. Versión y comandos disponibles

- `CONFIRMADO`: comandos top-level observados en `openclaw --help` incluyen `agent`, `agents`, `approvals`, `config`, `doctor`, `gateway`, `health`, `models`, `plugins`, `sessions`, `skills`, `status`, `tui`, entre muchos otros.
- `CONFIRMADO`: `openclaw help gateway` existe y expone `call`, `diagnostics`, `discover`, `health`, `install`, `probe`, `restart`, `run`, `stability`, `start`, `status`, `stop`, `uninstall`, `usage-cost`.
- `CONFIRMADO`: `openclaw help agents`, `skills`, `models`, `sessions`, `config`, `approvals`, `plugins`, `doctor`, `health`, `tui` existen.
- `NO ENCONTRADO`: no apareció un comando top-level `tools` en `openclaw --help`.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: no puede deducirse localmente cuál de esos comandos es el camino oficialmente recomendado para registrar tools HTTP para este proyecto.

## 10. Configuración local detectada

- `CONFIRMADO`: `gateway.mode = local`.
- `CONFIRMADO`: `gateway.bind = loopback`.
- `CONFIRMADO`: `gateway.port = 18789`.
- `CONFIRMADO`: `tools.profile = coding`.
- `CONFIRMADO`: `tools.web.search.provider = parallel-free`.
- `CONFIRMADO`: `agents.defaults.workspace = /Users/inma/.openclaw/workspace`.
- `CONFIRMADO`: `agents.defaults.model.primary = openai/gpt-5.4-mini`.
- `CONFIRMADO`: plugins configurados/activos observados: `openai`, `codex`, `parallel`.
- `CONFIRMADO`: `openclaw config file` falló en sandbox con `readonly database`, lo que confirma dependencia de SQLite/estado local incluso para comandos aparentemente de lectura.

## 11. Modelos y proveedor detectados

- `CONFIRMADO`: modelo predeterminado resuelto: `openai/gpt-5.4-mini`.
- `CONFIRMADO`: modelos permitidos observados: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`.
- `CONFIRMADO`: alias observados: `gpt -> openai/gpt-5.4`, `gpt-mini -> openai/gpt-5.4-mini`.
- `CONFIRMADO`: `openclaw models status --json` reportó `missingProvidersInUse: openai`.
- `CONFIRMADO`: el mismo estado reportó perfiles OAuth de OpenAI expirados.
- `BLOQUEANTE`: la instalación local no parece lista para usar el proveedor configurado sin reparación previa.

## 12. Agente y workspace activos

- `CONFIRMADO`: el workspace por defecto de OpenClaw no apunta al repo actual sino a `~/.openclaw/workspace`.
- `CONFIRMADO`: ese workspace contiene instrucciones activas genéricas y además identidad/contexto de otro producto: “Corevix CRM”. Evidencia: `~/.openclaw/workspace/USER.md:1-25`, `~/.openclaw/workspace/IDENTITY.md:1-24`.
- `CONFIRMADO`: `~/.openclaw/workspace/AGENTS.md` define reglas generales de memoria, heartbeats y herramientas, pero no contexto inmobiliario del proyecto actual. Evidencia: `~/.openclaw/workspace/AGENTS.md:1-220`.
- `BLOQUEANTE`: hoy no existe confirmación local de un agente OpenClaw activo configurado específicamente para “Real State Agent”.

## 13. Gateway, procesos y puertos

- `CONFIRMADO`: `openclaw gateway status` indicó LaunchAgent instalado pero “not loaded”.
- `CONFIRMADO`: `openclaw health --json` falló con `gateway_transport_error` y probe a `ws://127.0.0.1:18789`.
- `CONFIRMADO`: inspección de procesos mostró procesos de Node asociados a Codex/MCP, pero no un proceso visible de gateway OpenClaw, `agent-core`, `vite` ni `tsx` en ejecución.
- `CONFIRMADO`: `lsof -nP -iTCP -sTCP:LISTEN` no devolvió listeners relevantes para `18789`, `8787` o `5173`.
- `INFERIDO`: en este momento no hay gateway activo ni servicios del proyecto levantados localmente.
- `NO BLOQUEANTE`: la forma aparente de inicio/detención existe en CLI (`gateway start|run|stop|status`, `tui`, `chat`, `terminal`), pero no se validó ejecución activa porque la investigación fue solo de lectura.

## 14. Scripts reales de ejecución

- `CONFIRMADO`: raíz:
  - `pnpm dev`
  - `pnpm dev:core`
  - `pnpm dev:web`
  - `pnpm build`
  - `pnpm typecheck`
- `CONFIRMADO`: `agent-core`:
  - `pnpm --filter @real-estate-agent/agent-core dev`
  - `pnpm --filter @real-estate-agent/agent-core build`
  - `pnpm --filter @real-estate-agent/agent-core test`
  - `pnpm --filter @real-estate-agent/agent-core test:unit`
  - `pnpm --filter @real-estate-agent/agent-core test:integration`
  - `pnpm --filter @real-estate-agent/agent-core smoke:supabase`
  - `pnpm --filter @real-estate-agent/agent-core smoke:internal-api`
  - `pnpm --filter @real-estate-agent/agent-core typecheck`
- `CONFIRMADO`: `web-chat`:
  - `pnpm --filter @real-estate-agent/web-chat dev`
  - `pnpm --filter @real-estate-agent/web-chat build`
  - `pnpm --filter @real-estate-agent/web-chat typecheck`
- `CONFIRMADO`: `shared`:
  - `pnpm --filter @real-estate-agent/shared dev`
  - `pnpm --filter @real-estate-agent/shared build`
  - `pnpm --filter @real-estate-agent/shared typecheck`
- `CONFIRMADO`: OpenClaw local ofrece `gateway`, `tui|terminal`, `chat`, `doctor`, `status`, `models`, `skills`, `plugins`, `sessions`, etc.
- `NO ENCONTRADO`: scripts del repo para arrancar OpenClaw o conectarlo al monorepo.

## 15. Tools o ejemplos locales encontrados

- `CONFIRMADO`: el documento funcional del proyecto ya define tools oficiales del MVP. Evidencia: `docs/tool-map.md:7-22`.
- `CONFIRMADO`: dentro del repo todavía no hay implementación de esas tools en OpenClaw.
- `CONFIRMADO`: sí existen endpoints HTTP internos que se alinean con casi todas esas tools: `search_properties`, `resolve_property_reference`, `get_property_details`, `check_property_availability`, `get_property_media`, `get_property_documents`, `get_payment_plan`, `get_company_information`, `capture_lead`, `request_property_visit`, `request_human_handoff`.
- `NO ENCONTRADO`: implementación local de `compare_properties`.
- `CONFIRMADO`: en la instalación OpenClaw local sí hay ejemplos de tooling genérico vía plugins:
  - plugin `openclaw-macos-control-center` con tools semánticas de macOS.
  - plugin `openclaw-test-tool-plugin` con `test_echo_tool`.
- `INFERIDO`: hay capacidad local para plugins/tools en OpenClaw, pero no una adaptación del dominio inmobiliario todavía.

## 16. Skills e instrucciones locales encontradas

- `CONFIRMADO`: en el repo no hay skill inmobiliaria implementada.
- `CONFIRMADO`: en el repo sí hay documentación funcional candidata a alimentar skills futuras: `conversation-guide.md`, `memory-map.md`, `tool-map.md`, `sales-flow.md`, `asset-strategy.md`, `objection-handling.md`.
- `CONFIRMADO`: `conversation-guide.md` dice explícitamente que su objetivo es poder reutilizarse después en `SOUL.md` y en el skill comercial. Evidencia: `docs/conversation-guide.md:3-6`, `docs/conversation-guide.md:203-209`.
- `CONFIRMADO`: la instalación local de OpenClaw sí tiene instrucciones activas genéricas en `~/.openclaw/workspace/AGENTS.md`, `USER.md`, `IDENTITY.md`, `SOUL.md`, `TOOLS.md`.
- `CONFIRMADO`: esas instrucciones activas locales no están conectadas al repo inmobiliario sino a un workspace separado.
- `NO ENCONTRADO`: referencias locales activas que vinculen automáticamente el agent runtime con `docs/sales-flow.md`, `docs/conversation-guide.md`, `docs/tool-map.md` o `docs/memory-map.md` del repo actual.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: no puede confirmarse localmente el orden de prioridad entre instrucciones de workspace, skills, plugins y runtime.

## 17. Seguridad local

- `RIESGO`: `~/.openclaw/workspace` contiene identidad/contexto de otro producto (“Corevix CRM”), lo que podría contaminar un agente del proyecto inmobiliario si se reutiliza ese workspace por defecto. Severidad: alta.
- `RIESGO`: el gateway local estaba configurado para proveedor OpenAI con estado de auth faltante/expirado. Severidad: media.
- `RIESGO`: plugins genéricos de control local existen y exponen herramientas potentes del sistema (`macOS Control Center`). Severidad: media. Recomendación: aislar el workspace/perfil del proyecto antes de habilitar flujos reales.
- `RIESGO`: el repo usa rutas absolutas locales en la instalación OpenClaw (`/Users/inma/...`), lo que reduce portabilidad. Severidad: media.
- `CONFIRMADO`: no hay `.env` trackeados en Git aparte de `.env.example`.
- `CONFIRMADO`: `AGENT_INTERNAL_API_KEY` está protegido por Bearer middleware a nivel de `/internal/*`. Evidencia: `.env.example:4-6`, `apps/agent-core/src/middleware/internal-auth.ts:4-23`.
- `CONFIRMADO`: `web-chat` no habla directo con Supabase en el scaffold observado; solo consume `/health`. Evidencia: `apps/web-chat/src/App.tsx:13-49`.
- `NO ENCONTRADO`: secreto expuesto en archivos del repo inspeccionados.

## 18. Gaps bloqueantes

- `BLOQUEANTE`: no existe implementación de tools OpenClaw para este repo.
- `BLOQUEANTE`: `openclaw-workspace/` del repo sigue vacío/placeholder.
- `BLOQUEANTE`: el workspace activo local de OpenClaw corresponde a otro producto.
- `BLOQUEANTE`: el gateway local no está cargado/activo.
- `BLOQUEANTE`: el proveedor/modelo configurado para OpenClaw no está en estado sano por auth expirada/missing.
- `BLOQUEANTE`: no existe, dentro del repo, un puente explícito desde OpenClaw hacia los endpoints internos de `agent-core`.

## 19. Gaps no bloqueantes

- `NO BLOQUEANTE`: falta `compare_properties` a nivel de endpoint/contrato.
- `NO BLOQUEANTE`: la guía raíz `AGENTS.md` está desactualizada respecto al estado real del proyecto.
- `NO BLOQUEANTE`: `apps/web-chat` sigue siendo un scaffold técnico y aún no representa el flujo conversacional final.
- `NO BLOQUEANTE`: no hay evidencia local de observabilidad específica para tool calls del futuro flujo OpenClaw.
- `NO BLOQUEANTE`: no hay documentación interna en el repo que amarre explícitamente docs funcionales a una skill o SOUL inmobiliario.

## 20. Preguntas que no pueden resolverse sin documentación oficial

- `REQUIERE DOCUMENTACIÓN OFICIAL`: forma oficial de crear y registrar tools HTTP en OpenClaw para un agente como este.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: existencia y formato oficial de tool registry.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: mecanismo oficial de allowlist/aprobación de tools para producción.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: estructura recomendada de skills para mezclar tono conversacional, tool selection y memoria.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: prioridad exacta entre AGENTS, SOUL, USER, skills, plugins e instrucciones runtime.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: patrón oficial de contexto confiable y paso de memoria por turno.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: patrón oficial de manejo de sesiones y mapping entre sesión del canal y `conversationId`.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: mecanismo oficial de HTTP tool calling, timeouts, retries y aborts.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: hardening recomendado para gateway local/remoto, auth y observabilidad.
- `REQUIERE DOCUMENTACIÓN OFICIAL`: estrategia oficial de pruebas para tools, gateway y sesiones.

## 21. Archivos relevantes con líneas

- `AGENTS.md:16-30` muestra una foto atrasada del alcance del proyecto.
- `openclaw-workspace/README.md:1-7` confirma que el workspace del repo sigue sin implementación.
- `supabase/README.md:15-21` y `supabase/README.md:55-66` confirman persistencia conversacional y de conversión ya modelada.
- `package.json:6-13` y `apps/agent-core/package.json` muestran comandos reales disponibles.
- `.env.example:11-15` confirma variables previstas para Supabase/OpenClaw.
- `apps/web-chat/src/App.tsx:41-49` confirma que frontend sigue describiendo una fase de scaffold.
- `apps/agent-core/src/app.ts:51-58` confirma `/health`, auth y middlewares internos.
- `apps/agent-core/src/routes/internal/conversations.ts:20-45` confirma contexto, patch de estado y guardado de mensajes.
- `apps/agent-core/src/services/conversation.service.ts:108-238` confirma persistencia de memoria y mensajes.
- `apps/agent-core/src/services/lead.service.ts:12-66`, `visit.service.ts:12-68`, `human-handoff.service.ts:31-203` confirman persistencia comercial ya implementada.
- `packages/shared/src/index.ts:479-603` confirma memoria conversacional y resultado de contexto.
- `docs/tool-map.md:7-22` confirma tools oficiales del MVP.
- `docs/conversation-guide.md:203-209` confirma intención de reutilizar esa guía en SOUL/skill futuro.
- `docs/memory-map.md:91-109` confirma reglas mínimas de memoria.
- `~/.openclaw/workspace/USER.md:1-25` y `~/.openclaw/workspace/IDENTITY.md:1-24` evidencian desalineación con el proyecto actual.

## 22. Comandos ejecutados y resultado resumido

- `command -v openclaw` → binario encontrado en `~/.npm-global/bin/openclaw`.
- `openclaw --version` → `OpenClaw 2026.6.8 (844f405)`.
- `openclaw --help` → CLI instalada con comandos amplios, sin comando top-level `tools`.
- `openclaw help gateway|agents|skills|models|sessions|config|approvals|plugins|doctor|health|tui` → comandos existentes y documentados localmente.
- `openclaw models status --json` → workspace por defecto `~/.openclaw/workspace`, modelo `openai/gpt-5.4-mini`, auth OpenAI faltante/expirada.
- `openclaw gateway status` → servicio instalado pero no cargado.
- `openclaw health --json` → gateway no responde en `ws://127.0.0.1:18789`.
- `ps aux | egrep 'openclaw|agent-core|vite|tsx|node'` → sin gateway OpenClaw ni procesos del proyecto activos.
- `lsof -nP -iTCP -sTCP:LISTEN | egrep '18789|8787|5173|openclaw|node'` → sin listeners relevantes.
- `rg` y lectura de archivos del repo → backend y contratos mucho más avanzados que lo descrito por la guía raíz.

## Preguntas para la investigación de documentación oficial

1. ¿Cuál es el mecanismo oficial recomendado por OpenClaw para declarar tools HTTP externas y asociarlas a un agente?
2. ¿Existe un tool registry oficial y cuál es su formato estable?
3. ¿Cómo se define una allowlist o policy de tools en OpenClaw de forma recomendada?
4. ¿Cuál es la estructura oficial recomendada para una skill comercial con acceso a tools y memoria?
5. ¿Qué prioridad exacta tienen `AGENTS.md`, `SOUL.md`, `USER.md`, skills, plugins e instrucciones runtime?
6. ¿Cuál es el patrón oficial para mapear sesión de canal, sesión OpenClaw y `conversationId` del backend?
7. ¿Cómo recomienda OpenClaw pasar contexto confiable y memoria estructurada a cada turno?
8. ¿Existe soporte oficial o recomendado para HTTP tool calling con timeout, retry y abort signal?
9. ¿Qué patrón oficial se recomienda para observabilidad de tool calls, errores y trazas?
10. ¿Qué prácticas oficiales de seguridad se recomiendan para gateway local, tokens, plugins y separación por workspace/perfil?
11. ¿Cuál es la estrategia oficial de testing para skills, tools, sesiones y gateway?

| Área | Estado local | Evidencia | Riesgo | Requiere investigación externa |
| ---- | ------------ | --------- | ------ | ------------------------------ |
| Monorepo | Backend y datos avanzados; guía raíz atrasada | `AGENTS.md:16-30`, `supabase/README.md:15-21`, rutas y servicios observados | Medio | No |
| `agent-core` | Bastante listo para tools HTTP | `apps/agent-core/src/app.ts:46-58`, rutas internas | Bajo | No |
| Contratos HTTP | Casi completos para MVP | `packages/shared/src/index.ts`, rutas internas | Bajo | No |
| Persistencia conversacional | Implementada y usable | `conversation.service.ts`, `lead.service.ts`, `visit.service.ts`, `human-handoff.service.ts` | Bajo | No |
| `openclaw-workspace` del repo | Placeholder | `openclaw-workspace/README.md:1-7` | Alto | No |
| Instalación local OpenClaw | Instalada pero desalineada | binario, versión, `~/.openclaw/workspace/*` | Alto | No |
| Workspace activo | Apunta a Corevix CRM, no al proyecto inmobiliario | `~/.openclaw/workspace/USER.md:1-25` | Alto | No |
| Gateway | Instalado pero no cargado ni respondiendo | `gateway status`, `health --json` | Alto | No |
| Modelos/proveedor | Configurados pero con auth dañada/expirada | `models status --json` | Alto | No |
| Tools OpenClaw del proyecto | No existen aún | repo inspeccionado, `tool-map.md` vs código | Alto | No |
| Skill inmobiliaria | No encontrada | repo y workspace inspeccionados | Medio | No |
| Tool registry / allowlist oficial | No confirmable localmente | solo comandos `help` | Medio | Sí |

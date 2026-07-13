# Phase 4B.0 Conversation Bootstrap

## Estado

```text
FASE 4B.0 BLOQUEADA
```

La base de backend y cliente interno del plugin quedó preparada, pero OpenClaw 2026.6.8 no mostró hooks del plugin para capturar automáticamente la respuesta final del asistente.

## 1. Contexto runtime confirmado

`CONFIRMADO`: `openclaw sessions --agent real-estate-agent --json --limit 5` devuelve `key`, `sessionId` y `agentId` para sesiones reales.

`CONFIRMADO`: las trayectorias locales contienen `sessionKey`, `sessionId`, `runId` y `workspaceDir`.

`CONFIRMADO`: `openclaw plugins inspect real-estate-tools --runtime --json` muestra `hookNames: []` y `hookCount: 0`.

`INFERIDO`: `sessionKey` debe estar disponible dentro de `ToolPluginExecutionContext` porque el runtime lo registra en trayectoria y el plugin lo extrae desde `context.api`, `runContext` o `toolContext`.

## 2. Endpoint creado

```text
POST /internal/conversations/resolve
```

La ruta usa Bearer auth porque cuelga de `/internal/*`, usa body limit/timeout existentes y devuelve envelope uniforme con `jsonSuccess`.

## 3. Contratos

Se agregaron contratos compartidos:

- `conversationChannelValues`;
- `conversationChannelSchema`;
- `resolveConversationMetadataSchema`;
- `resolveConversationInputSchema`;
- `resolveConversationResultSchema`;
- tipos `ConversationChannel`, `ResolveConversationInput`, `ResolveConversationResult`.

El enum real de canal es:

```text
web
```

No se usó `web_chat` porque no existe en la migración actual.

## 4. Repository

`ConversationRepository` ahora soporta:

- `findByExternalSession`;
- `createConversation`;
- `createConversationState`.

La búsqueda usa:

```text
company_id
channel
external_session_id
```

## 5. Service

`ConversationService.resolveOrCreateConversation`:

1. valida el input compartido;
2. valida empresa activa cuando hay `CompanyRepository`;
3. busca conversación existente;
4. crea conversación si no existe;
5. crea `conversation_state` inicial si falta;
6. devuelve `conversationId`, `companyId`, `currentSalesStage`, `memoryVersion`, `created`;
7. maneja unique violation `23505` releyendo la fila creada por otra llamada concurrente.

## 6. Mapping `sessionKey`

El mapping aprobado es:

```text
sessionKey -> conversations.external_session_id
```

No se guarda en memoria del modelo ni en estado local del plugin.

## 7. `companyId`

El plugin acepta `companyId` como configuración privada tipada.

Reglas:

- no es argumento visible de tool;
- no viene del texto del usuario;
- no se guarda en manifest;
- el backend valida empresa;
- las rutas existentes validan pertenencia en operaciones sensibles.

## 8. `channel`

El plugin acepta `channel`, con default `web`, porque ese es el enum real de base de datos.

## 9. Persistencia user

Se agregó método interno de cliente:

```text
saveConversationMessage
```

Y helper:

```text
saveTrustedConversationMessage
```

También se agregó `createConversationClientMessageId`, determinístico por:

```text
sessionKey + runId/toolCallId + role
```

`LIMITACIÓN`: todavía no hay hook confirmado para capturar automáticamente el mensaje original antes o después de una tool. La trayectoria sí contiene el prompt, pero eso no equivale a una API estable del plugin.

## 10. Persistencia assistant

`BLOQUEANTE`: `real-estate-tools` no tiene `after assistant response hook`, `after run hook` ni `final response event` en inspección runtime.

Por tanto, no se puede declarar persistencia automática confiable de la respuesta final sin una pieza adicional.

## 11. Carga de contexto

Se agregó método interno de cliente:

```text
getConversationContext
```

Y helper:

```text
loadTrustedConversationContext
```

La carga usa `GET /internal/conversations/:conversationId/context`.

## 12. Idempotencia

Backend:

- dos llamadas iguales a `/internal/conversations/resolve` devuelven la misma conversación;
- si la creación concurrente choca con el índice único, se reconsulta;
- el state inicial se crea solo si falta;
- no se sobrescribe memoria existente.

Mensajes:

- la idempotencia sigue usando `clientMessageId` por conversación.

## 13. Tests

Agregados/actualizados:

- unitarios de `ConversationService` para resolve existente, creación nueva, state, carrera y payload inválido;
- integración de `/internal/conversations/resolve`;
- tests de config del plugin para `companyId`/`channel`;
- tests de cliente para resolve/context/messages;
- tests de helpers internos de conversación.

Resultado ejecutado:

- `pnpm --filter @real-estate-agent/shared build`: pasa.
- `pnpm --filter @real-estate-agent/agent-core typecheck`: pasa.
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck`: pasa.
- `pnpm --filter @real-estate-agent/agent-core test:unit`: pasa.
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools test`: pasa.
- `pnpm --filter @real-estate-agent/agent-core test:integration`: pasa con Supabase real y seed intacto.

## 14. Smoke

Se agregó:

```text
pnpm --filter @real-estate-agent/agent-core smoke:conversation-bootstrap
```

El smoke:

1. crea `externalSessionId` temporal;
2. resuelve conversación;
3. resuelve de nuevo;
4. confirma mismo UUID;
5. carga contexto;
6. guarda mensaje temporal;
7. limpia por `runId`;
8. valida seed intacto.

Resultado ejecutado:

- `pnpm --filter @real-estate-agent/agent-core smoke:conversation-bootstrap`: bloqueado por entorno, porque no hay `AGENT_INTERNAL_API_KEY` ni `OPENCLAW_AGENT_CORE_API_KEY` disponible para llamar a un `agent-core` activo.

## 15. Cleanup

El cleanup usa los helpers existentes de fixtures por `metadata.runId`.

## 16. Riesgos

- `sessionKey` dentro de `ToolPluginExecutionContext` no fue observado con una nueva tool temporal.
- No hay hook runtime para persistir assistant final.
- La operación de creación no es una transacción SQL única; usa índice único + relectura como mitigación.
- `conversation_state` no tiene optimistic concurrency para esta fase.

## 17. Limitaciones

- No se implementó `search_properties`.
- No se agregó tool visible nueva.
- No se implementó endpoint atómico grande de turno.
- No se modificó web chat.
- No se modificó seed.

## 18. Rollback

Revertir estos cambios:

- contratos compartidos de resolve conversation;
- métodos repository/service/ruta;
- métodos internos del plugin;
- tests y smoke;
- documentación 4B.0.

No hay migraciones ni cambios de seed que revertir.

## 19. Definition of Done

| Criterio | Estado |
| --- | --- |
| sessionKey está confirmado en runtime | Parcial: confirmado en sesiones/trayectoria, no en execute instrumentado |
| Existe resolve/create conversation HTTP | Sí |
| Mapping usa external_session_id | Sí |
| Misma sesión devuelve misma conversación | Implementado y cubierto |
| Nueva sesión crea conversación distinta | Implementado por índice external session |
| conversation_state se crea automáticamente | Sí |
| companyId no es controlado por el modelo | Sí, config privada |
| conversationId no es visible al modelo | Sí, helpers internos |
| Plugin puede resolver conversación | Método interno implementado |
| Plugin puede cargar contexto | Método interno implementado |
| Persistir user message confiable | Parcial: método interno/idempotencia, sin hook automático |
| Persistir assistant message confiable | No, bloqueado por falta de hook |
| Persistencia es idempotente | Sí para endpoint y mensajes por clientMessageId |
| Tests unitarios pasan | Sí |
| Tests de integración pasan | Sí |
| Smoke crea y limpia fixtures | No ejecutado por falta de Bearer local |
| Seed permanece intacto | Sí en integración |
| Gateway permanece saludable | No modificado |
| No se implementó search_properties | Sí |
| main no recibió tools nuevas | Sí |

## 20. Siguiente paso 4B.1

Antes de 4B.1 hay que resolver el bloqueo de persistencia automática de la respuesta final.

Siguiente paso recomendado:

```text
Fase 4B.1 — search_properties y primer flujo de búsqueda con datos reales.
```

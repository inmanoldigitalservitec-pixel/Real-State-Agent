# Phase 4B Search Readiness

## 1. Resumen ejecutivo

`CONFIRMADO`: el backend ya contiene contrato, servicio, repositorio y tests para `POST /internal/properties/search`, además de rutas internas para contexto, mensajes y estado de conversación. La búsqueda real puede devolver propiedades, precio, moneda, imagen de portada y conteo de unidades disponibles.

`BLOQUEANTE`: 4B no está listo para implementarse directamente como end-to-end real porque no existe ruta HTTP para crear o resolver una conversación desde `sessionKey`, no existe mapping persistente `sessionKey -> conversationId`, `companyId` no está guardado en la configuración del plugin, y el SDK local del plugin no confirma hooks automáticos para guardar el mensaje del usuario y la respuesta final del asistente.

`DECISIÓN`: implementar primero `4B.0`.

## 2. Estado confirmado de 4A

`CONFIRMADO`: el plugin vive en `openclaw-workspace/plugins/real-estate-tools/` y registra tools con `defineToolPlugin`. La tool actual es `agent_core_health`, definida en `src/index.ts` con `name`, `label`, `description`, `parameters` y `execute(params, config, context)`.

`CONFIRMADO`: `agent_core_health` usa un schema vacío con `additionalProperties: false`.

`CONFIRMADO`: el contexto confiable se construye en `buildTrustedToolContext`, extrayendo `agentId`, `sessionId`, `sessionKey`, `workspaceDir` desde `context.api`, `context.api.runContext` o `context.api.runContext.toolContext`, y siempre incluye `toolCallId`.

`CONFIRMADO`: el `.d.ts` local del SDK solo tipa `api.logger`, `signal`, `toolCallId` y `onUpdate`. Por tanto, `TrustedToolContext` está conectado de forma defensiva a datos que la documentación de 4A dice que existen en runtime, pero no está garantizado por el tipo local.

`CONFIRMADO`: el logger viene de `context.api.logger`, normalizado con `createLogger`.

`CONFIRMADO`: `AgentCoreClient` se instancia por tool con la configuración resuelta y el logger.

`CONFIRMADO`: `baseUrl` viene de `config.baseUrl` o de `OPENCLAW_AGENT_CORE_BASE_URL`, con default `http://127.0.0.1:8787`.

`CONFIRMADO`: el Bearer token se lee desde `process.env[internalApiKeyEnvVar]`, cuyo default es `OPENCLAW_AGENT_CORE_API_KEY`. La health tool llama `/health` con `auth: false`; futuras rutas `/internal/*` deben usar auth.

`CONFIRMADO`: el correlation ID se construye como `oc_<tool>_<agent>_<timestamp>_<random>`.

`CONFIRMADO`: errores estructurados de `agent-core` se traducen a `AgentCoreClientError` con `code`, `status`, `retryable`, `requiresClarification`, `requiresHuman` y `correlationId`.

`CONFIRMADO`: la restricción a `real-estate-agent` no está en `openclaw.plugin.json`; se documentó como policy agent-scoped `allow`, `alsoAllow` y `deny`.

`RECOMENDACIÓN`: añadir `search_properties` extendiendo el array `tools: (tool) => [...]`, sin cambiar `agent_core_health`, y actualizar `openclaw.plugin.json.contracts.tools`.

## 3. Contrato real de `search_properties`

`CONFIRMADO`: ruta real: `POST /internal/properties/search`.

`CONFIRMADO`: body validado por `propertySearchInputSchema`.

Campos reales de entrada:

| Campo | Estado | Tipo/regla |
| --- | --- | --- |
| `companyId` | opcional | UUID |
| `location` | opcional | string trim min 1 |
| `sector` | opcional | string trim min 1 |
| `city` | opcional | string trim min 1 |
| `bedrooms` | opcional | entero >= 0 |
| `bathrooms` | opcional | entero >= 0 |
| `parkingSpaces` | opcional | entero >= 0 |
| `minimumPrice` | opcional | number >= 0 |
| `maximumPrice` | opcional | number >= 0 |
| `currency` | opcional | string trim min 1 |
| `propertyType` | opcional | `apartment`, `penthouse`, `villa`, `townhouse`, `studio`, `commercial`, `office`, `land` |
| `amenities` | opcional | array de strings |
| `availability` | opcional | `available`, `reserved`, `sold`, `unavailable`, `hold` |
| `limit` | default | entero positivo max 10, default 3 |

`NO ENCONTRADO`: `purpose`, `conversationId`, `listingId`, `projectId` y `unitId` no forman parte del contrato de búsqueda.

`CONFIRMADO`: salida real: array de `propertySearchResultSchema`.

Campos reales de cada resultado:

`propertyId`, `propertyCode`, `propertyName`, `propertyType`, `developmentId`, `developmentName`, `locationLabel`, `sector`, `city`, `bedrooms`, `bathrooms`, `parkingSpaces`, `areaFromM2`, `areaToM2`, `priceFrom`, `priceTo`, `currency`, `summary`, `features`, `coverImageUrl`, `availableUnits`, `lastVerifiedAt`.

`CONFIRMADO`: cero resultados se representa como `success: true` con `data: []`.

`CONFIRMADO`: ordenamiento inicial por `properties.sort_order asc`; luego filtros en memoria y `slice(0, limit)`.

`CONFIRMADO`: la disponibilidad sí viene incluida como conteo `availableUnits`, calculado sobre unidades activas con `status === "available"`. No incluye detalle de unidades; eso pertenece a `/availability`.

`CONFIRMADO`: imágenes incluidas solo como `coverImageUrl`, si existe media `cover_image`.

`CONFIRMADO`: precio incluido como `priceFrom` y `priceTo`; moneda en `currency`.

`NO ENCONTRADO`: `projectId`; el contrato usa `developmentId`.

`NO ENCONTRADO`: `listingId` y `unitId` en la respuesta de búsqueda.

Errores posibles:

`UNAUTHORIZED` 401 por Bearer faltante o inválido; `VALIDATION_ERROR` 400 por body inválido; `DATABASE_ERROR`/`UNEXPECTED_ERROR` 500 por fallos de Supabase o runtime; `UNEXPECTED_ERROR` 504 por timeout interno.

## 4. Fuente confiable de `companyId`

`CONFIRMADO`: el seed define una compañía demo fija:

```text
00000000-0000-0000-0000-000000000001
Nova Casa Realty
```

`NO ENCONTRADO`: `companyId` no está actualmente en `pluginConfigSchema`, `openclaw.plugin.json`, `openclaw-workspace/.openclaw/workspace-state.json`, `AGENTS.md`, `TOOLS.md` ni en el contexto tipado del plugin.

`CONFIRMADO`: las conversaciones, propiedades, unidades, listings, leads, visitas y eventos guardan `company_id`.

`CONFIRMADO`: `saveMessage` valida que `conversation.company_id === companyId`. `OwnershipValidator` valida conversación, propiedad, unidad y listing contra `companyId`.

Respuestas:

1. `CONFIRMADO`: existe un `companyId` fijo para el MVP en seed.
2. `NO ENCONTRADO`: no está guardado en configuración del plugin.
3. `RECOMENDACIÓN`: debe formar parte de configuración confiable del plugin o resolverse por backend desde agente/canal, nunca venir del modelo.
4. `CONFIRMADO`: puede obtenerse desde `conversationId` si la conversación ya existe, porque `conversations.company_id` es obligatorio.
5. `RECOMENDACIÓN`: el modelo no debe enviarlo.
6. `RECOMENDACIÓN`: mantener `companyId` como parámetro interno de config/contexto y sobrescribir cualquier valor visible.
7. `CONFIRMADO`: validaciones de tenant existen en `saveMessage` y en `OwnershipValidator`; búsqueda filtra por `companyId` si se provee, pero no lo requiere.

Fuente recomendada para 4B.0: `companyId` fijo del MVP guardado como config privada del plugin o, mejor, resuelto por un endpoint de conversación en `agent-core` que valide la compañía activa y devuelva `conversationId + companyId` desde `sessionKey`.

## 5. Estrategia de `conversationId`

`CONFIRMADO`: `conversations.external_session_id` existe y tiene índice único por `(company_id, channel, external_session_id)` cuando no es null.

`NO ENCONTRADO`: no existe ruta HTTP para crear conversación.

`NO ENCONTRADO`: no existe método repository/service expuesto para insertar conversación general; los tests crean fixtures insertando directamente en Supabase.

`CONFIRMADO`: el plugin intenta leer `sessionKey` desde runtime, pero no existe persistencia local ni backend mapping.

Respuestas:

1. `RECOMENDACIÓN`: `agent-core` debe crear/resolver la conversación para un usuario nuevo.
2. `NO ENCONTRADO`: no existe ruta HTTP para hacerlo.
3. `NO ENCONTRADO`: no hay ruta actual reutilizable; las rutas existentes requieren `conversationId`.
4. `BLOQUEANTE`: debe agregarse un endpoint antes de 4B real.
5. `INFERIDO`: 4B podría funcionar con conversación temporal o seed solo para prueba técnica.
6. `BLOQUEANTE`: no es aceptable para el criterio end-to-end real porque no representa usuario nuevo ni continuidad por sesión.
7. `RECOMENDACIÓN`: mapping `sessionKey -> conversationId` debe vivir en `conversations.external_session_id`, no en memoria del modelo.
8. `RECOMENDACIÓN`: el segundo turno resuelve la misma conversación buscando `(companyId, channel, externalSessionId=sessionKey)`.
9. `RECOMENDACIÓN`: sesión nueva crea/resuelve otra conversación.
10. `RECOMENDACIÓN`: el modelo no debe conocer ni manipular el UUID.
11. `RECOMENDACIÓN`: el plugin obtiene `conversationId` desde contexto confiable/backend y no lo expone como argumento visible.

## 6. Creación de conversaciones

`CONFIRMADO`: la tabla `conversations` requiere `company_id`, tiene `channel`, `external_session_id`, estado comercial, status y metadata.

`CONFIRMADO`: la tabla `conversation_state` requiere `conversation_id` y `company_id`, y sostiene memoria comercial.

`CONFIRMADO`: el helper de tests `createSupabaseTestFixture` inserta conversación y estado directamente con `metadata.runId` y luego limpia por run.

`BLOQUEANTE`: falta un endpoint interno tipo `POST /internal/conversations/resolve` o `POST /internal/conversations` que haga upsert seguro por `companyId + channel + externalSessionId`, cree estado inicial y devuelva IDs.

## 7. Mapping sesión ↔ conversación

`CONFIRMADO`: el esquema ya tiene el lugar correcto: `conversations.external_session_id`.

`NO ENCONTRADO`: el plugin no persiste ni consulta ese mapping.

`RECOMENDACIÓN`: 4B.0 debe implementar una operación interna que reciba `sessionKey` confiable, no visible al modelo, y obtenga o cree una conversación. Para OpenClaw, `sessionKey` debe ser tratado como identificador externo opaco.

## 8. Persistencia de mensajes

`CONFIRMADO`: ruta real: `POST /internal/conversations/:conversationId/messages`.

Schema body real:

| Campo | Estado |
| --- | --- |
| `companyId` | obligatorio |
| `role` | obligatorio: `system`, `assistant`, `user`, `tool`, `human_agent` |
| `content` | obligatorio, string trim min 1 |
| `salesStage` | opcional |
| `clientMessageId` | opcional |
| `toolName` | opcional |
| `rawPayload` | opcional |
| `uiPayload` | opcional |
| `assetIds` | default `[]` |

`CONFIRMADO`: idempotencia por `clientMessageId` dentro de una conversación. Si existe, retorna el mensaje existente y no inserta.

`CONFIRMADO`: side effects: inserta en `messages`, actualiza `conversations.last_message_at` y `conversations.current_sales_stage`.

`CONFIRMADO`: valida conversación y empresa en `saveMessage`; si no coinciden lanza `CONFLICT`.

Persistencia esperada:

1. mensaje del usuario: `role: "user"`, `content` literal del usuario, `clientMessageId` determinístico por turno.
2. respuesta de Carlos: `role: "assistant"`, `content` final, `salesStage` correcto, `clientMessageId` determinístico.

`BLOQUEANTE`: con el SDK local no hay hook confirmado `after assistant response`; depender de que el modelo llame una tool de guardado puede fallar.

`RECOMENDACIÓN`: para 4B, no delegar guardado al modelo. Usar un wrapper/orquestación automática o un endpoint de turno. Si no se implementa endpoint atómico aún, usar como mitigación una tool compuesta que guarde usuario + búsqueda + estado, y dejar el guardado de respuesta en un hook/wrapper solo si se confirma en runtime. Si no hay hook, 4B.0 debe agregar una ruta de turno o mecanismo equivalente.

## 9. Carga de contexto

`CONFIRMADO`: ruta real: `GET /internal/conversations/:conversationId/context`.

Query real: `messageLimit`, coerce number, entero positivo, máximo 50, default 20.

Devuelve:

`conversationId`, `currentSalesStage`, `summary`, `sourceListingId`, `sourcePropertyId`, `sourcePropertyUnitId`, `memory`, `messages`.

`memory` incluye ubicación, habitaciones, baños, parqueos, presupuesto, moneda, property ids recientes/recomendados/rechazados, `pendingQuestion`, `lastCustomerIntent`, `lastAgentQuestion`, `memoryVersion`, `sourceListingId`, `sourcePropertyId`.

`messages` incluye últimos mensajes con `id`, `role`, `content`, `salesStage`, `toolName`, `assetIds`, `createdAt`.

`RECOMENDACIÓN`: cargar contexto antes de cada turno, con `messageLimit` pequeño para 4B. No meter toda la conversación dentro de `search_properties`; la tool puede recibir/usar contexto interno resumido, y devolver al modelo solo memoria útil: preferencias, últimos property ids, etapa, pregunta pendiente.

## 10. Actualización de memoria y estado

`CONFIRMADO`: ruta real: `PATCH /internal/conversations/:conversationId/state`.

Campos patchables reales:

`customerName`, `phone`, `email`, `preferredContactMethod`, `preferredLocations`, `rejectedLocations`, `bedrooms`, `bathrooms`, `parkingSpaces`, `propertyTypes`, `minimumAreaM2`, `maximumBudget`, `currency`, `importantAmenities`, `deliveryPreference`, `purchasePurpose`, `financingRequired`, `purchaseTimeline`, `mainObjections`, `leadTemperature`, `salesStage`, `activePropertyId`, `activePropertyUnitId`, `interestedPropertyIds`, `recommendedPropertyIds`, `viewedPropertyIds`, `rejectedPropertyIds`, `recentPropertyIds`, `sentAssetIds`, `sentBrochureIds`, `sentFloorPlanIds`, `sentPaymentPlanIds`, `lastCustomerIntent`, `lastAgentQuestion`, `pendingQuestion`, `conversationSummary`, `sourceListingId`, `sourcePropertyId`, `visitRequested`, `preferredVisitDate`, `preferredVisitTime`, `handoffRequested`, `handoffReason`, `assignedAgent`.

`CONFIRMADO`: no acepta patch vacío.

`CONFIRMADO`: arrays se mergean y deduplican. Escalares se actualizan con `??`, lo cual preserva el valor anterior cuando el patch trae `null`.

`CONFIRMADO`: `memoryVersion` existe y se incrementa automáticamente, pero el schema no permite enviar versión esperada. No hay optimistic concurrency real.

Para “Busco un apartamento de 3 habitaciones en Santo Domingo”:

```json
{
  "preferredLocations": ["Santo Domingo"],
  "bedrooms": 3,
  "propertyTypes": ["apartment"],
  "recommendedPropertyIds": ["...result ids..."],
  "recentPropertyIds": ["...result ids..."],
  "lastCustomerIntent": "property_search",
  "salesStage": "RECOMMENDATION",
  "pendingQuestion": "..."
}
```

`INFERIDO`: una sola llamada puede guardar todos los cambios de estado después de buscar, porque necesita ids reales de resultados para `recommendedPropertyIds` y `recentPropertyIds`.

`BLOQUEANTE`: riesgo de persistencia parcial si se guardan mensaje, búsqueda, state y respuesta como llamadas separadas. Para MVP puede mitigarse con idempotency keys y orden cuidadoso, pero no resuelve atomicidad.

## 11. Diseño exacto de la tool

Nombre:

```text
search_properties
```

Descripción operativa:

Usar cuando el cliente pide opciones de propiedades y ya hay al menos zona o ciudad y un criterio principal como habitaciones, tipo o presupuesto. Si falta zona/ciudad y no hay una preferencia previa en memoria, Carlos debe pedir una aclaración. Si falta habitaciones pero el cliente dio ubicación y pidió opciones generales, puede buscar con límite bajo o preguntar, según la amplitud del inventario. No usar para disponibilidad detallada, planes de pago, documentos o fotos adicionales.

Parámetros visibles recomendados:

| Parámetro tool | Backend |
| --- | --- |
| `location` | `location` |
| `city` | `city` |
| `sector` | `sector` |
| `bedrooms` | `bedrooms` |
| `bathrooms` | `bathrooms` |
| `parkingSpaces` | `parkingSpaces` |
| `minimumPrice` | `minimumPrice` |
| `maximumPrice` | `maximumPrice` |
| `currency` | `currency` |
| `propertyType` | `propertyType` |
| `amenities` | `amenities` |
| `availability` | `availability`, solo si la búsqueda necesita filtrar por estado |
| `limit` | `limit`, default 3, máximo visible recomendado 3 aunque backend permita 10 |

Parámetros no visibles:

`companyId`, `conversationId`, `sessionKey`, `sessionId`, `agentId`, `userId`, Bearer token, `baseUrl`, correlation ID.

## 12. Resultado compacto

Resultado recomendado para el modelo:

```ts
{
  ok: true,
  query: {
    location?: string;
    city?: string;
    sector?: string;
    bedrooms?: number;
    propertyType?: string;
  },
  results: Array<{
    index: number;
    propertyId: string;
    name: string;
    project: string;
    location: string | null;
    sector: string | null;
    city: string;
    bedrooms: number | null;
    bathrooms: number | null;
    parkingSpaces: number | null;
    areaFromM2: number | null;
    areaToM2: number | null;
    priceFrom: number | null;
    priceTo: number | null;
    currency: string;
    availableUnits: number;
    coverImageUrl: string | null;
    summary: string | null;
  }>;
  zeroResults: boolean;
  correlationId: string;
}
```

Evitar exponer storage paths, bucket names, metadata, tenant IDs, timestamps técnicos, raw Supabase rows, `companyId`, `developmentId` salvo que sea necesario internamente, y `lastVerifiedAt` salvo que se use para prudencia comercial.

## 13. Presentación de propiedades

`CONFIRMADO`: `RECOMMENDATION` debe mostrar entre una y tres opciones.

Reglas:

- máximo 3 resultados aunque el backend permita 10;
- mencionar nombre/modelo, proyecto, ubicación, habitaciones/baños/parqueos si vienen;
- usar “precio desde” cuando `priceFrom` exista;
- decir disponibilidad solo como conteo si viene de búsqueda: “aparecen X unidades disponibles”, evitando prometer unidad específica;
- una pregunta principal por turno;
- con un resultado: presentarlo y preguntar si quiere detalles, fotos o disponibilidad detallada;
- con cero resultados: reconocerlo, pedir un ajuste útil, no inventar alternativas;
- con más de tres resultados: seleccionar 1-3 por orden backend y decir que se muestran las más alineadas;
- no inventar amenidades fuera de `features`/`summary`.

Ejemplo conceptual:

```text
Encontré dos opciones de 3 habitaciones que encajan:
1. Apartamento Urbano 3H Plus, en Torre Horizonte Kennedy, desde RD$7.85MM...
2. ...
¿Quieres que revisemos más detalle de alguna?
```

## 14. Continuidad del segundo turno

Escenario:

```text
Turno 1: “Busco un apartamento de 3 habitaciones en Santo Domingo”
Turno 2: “¿Cuál de esas tiene disponibilidad?”
```

Para que funcione, el turno 1 debe guardar:

- `preferredLocations: ["Santo Domingo"]`;
- `bedrooms: 3`;
- `propertyTypes: ["apartment"]`;
- `recommendedPropertyIds` y `recentPropertyIds` con los resultados mostrados;
- idealmente `activePropertyId` si solo hubo un resultado;
- mensajes user/assistant;
- `lastCustomerIntent: "property_search"`;
- `salesStage: "RECOMMENDATION"`;
- un mapping confiable de sesión a conversación.

Respuestas:

1. `CONFIRMADO`: búsqueda ya incluye `availableUnits`.
2. `INFERIDO`: Carlos puede responder de forma limitada con el conteo de unidades disponibles por propiedad mostrado en búsqueda. No puede confirmar detalle por unidad sin `check_property_availability`.
3. `RECOMENDACIÓN`: el segundo turno de 4B debe validarse como continuidad de referencias a “esas”, no como disponibilidad detallada de unidades.
4. `RECOMENDACIÓN`: mejor pregunta de cierre para 4B: “¿Cuál de esas te interesa más para revisarla en detalle?”.
5. `RECOMENDACIÓN`: corregir criterio de continuidad para no adelantar 4C.
6. `RECOMENDACIÓN`: continuidad validable sin 4C: recordar las opciones mostradas, responder comparativamente con `availableUnits` ya recibido, o pedir cuál desea revisar.

## 15. Skill mínima

`CONFIRMADO`: `AGENTS.md` ya contiene reglas mínimas: español, tono profesional, una pregunta por turno, no inventar, no exponer detalles técnicos.

`CONFIRMADO`: `TOOLS.md` aún dice que en Fase 4.0 no hay tools inmobiliarias conectadas.

`CONFIRMADO`: policy audit documenta `agents.list[].skills` y recomendó `skills: []` para Carlos.

`RECOMENDACIÓN`: 4B no necesita una skill formal grande. Bastan instrucciones mínimas temporales en `TOOLS.md`/descripción de tool y policy agent-scoped:

- cuándo buscar;
- cuándo pedir aclaración;
- máximo tres resultados;
- no inventar;
- guardar contexto mediante orquestación, no por memoria del modelo;
- una pregunta por turno.

## 16. Hooks y orquestación

Alternativas:

| Opción | Evaluación |
| --- | --- |
| A. Tools explícitas decididas por modelo | Simple, pero baja confiabilidad para persistir mensajes/estado. |
| B. Hooks automáticos | Ideal, pero `NO ENCONTRADO` en el SDK local inspeccionado. |
| C. Wrapper de runtime | Confiable si OpenClaw lo permite; requiere validación fuera del repo. |
| D. Tool compuesta que busque y persista | Buena para búsqueda + state, no guarda respuesta final si no recibe el texto final. |
| E. Endpoint de turno | Más atómico y confiable, mayor complejidad y cambia backend. |
| F. Combinación mínima | Recomendado: resolver conversación + tool compuesta + endpoint/wrapper para respuesta. |

`RECOMENDACIÓN`: para 4B.0 confirmar si OpenClaw 2026.6.8 ofrece hook posterior a respuesta. Si no, implementar un endpoint de turno mínimo o wrapper que guarde ambos mensajes y estado; no depender de tool explícita de guardado.

## 17. Endpoint atómico

`NO BLOQUEANTE` para búsqueda pura.

`BLOQUEANTE` para criterio estricto “persistencia de mensajes, memoria y estado” si no hay hooks.

Fallos parciales posibles:

- se guarda mensaje usuario pero falla búsqueda;
- se devuelve búsqueda pero falla state patch;
- se guarda state pero no respuesta;
- se guarda respuesta con etapa incorrecta;
- segundo turno no resuelve conversación por falta de mapping.

`RECOMENDACIÓN`: no implementar `POST /internal/conversations/:conversationId/turns` completo si 4B.0 confirma un hook confiable. Si no hay hook, un endpoint de turno mínimo pasa de “posterior” a prerrequisito.

## 18. Estrategia de tests

Unitarios del plugin:

- schema visible de `search_properties`;
- normalización de `limit` a 1-3;
- adaptación de argumentos a backend;
- inyección interna de `companyId` y no aceptación desde modelo;
- resultado compacto;
- cero resultados;
- múltiples resultados;
- errores estructurados;
- redacción de respuesta/metadata sin secretos.

Integración:

- búsqueda real contra Supabase con fixture temporal;
- crear/resolver conversación temporal por `sessionKey`;
- guardar mensaje usuario;
- actualizar memoria;
- guardar respuesta;
- cleanup por metadata;
- seed intacto.

Runtime:

- plugin carga;
- `agent_core_health` sigue funcionando;
- `search_properties` visible solo para `real-estate-agent`;
- `main` no recibe la tool.

Conversacionales:

- ubicación + habitaciones completas;
- falta ubicación;
- falta habitaciones;
- cero resultados;
- 1-3 resultados;
- no inventar;
- una pregunta;
- continuidad del segundo turno con “esas”.

Seguridad:

- manipulación de `companyId`;
- manipulación de `conversationId`;
- prompt injection;
- intento de URL/baseUrl;
- token no aparece en logs;
- payload excesivo.

## 19. Datos demo confirmados

`CONFIRMADO`: seed company: `00000000-0000-0000-0000-000000000001`.

Consulta recomendada para criterio de salida:

```json
{
  "companyId": "00000000-0000-0000-0000-000000000001",
  "location": "Santo Domingo",
  "bedrooms": 3,
  "propertyType": "apartment",
  "limit": 3
}
```

`CONFIRMADO POR SEED + REPOSITORIO`: devuelve 1 propiedad, porque `location` busca substring en nombre, `development.location_label`, `development.sector` y `development.city`. Para `Santo Domingo`, `Apartamento Urbano 3H Plus` coincide por `city: "Santo Domingo"`. `Apartamento Familiar 3H` está en `city: "Santo Domingo Norte"` y no contiene exactamente `"Santo Domingo"`? Sí lo contiene como substring, por lo que también puede coincidir por búsqueda flexible `location`. La consulta estricta `city: "Santo Domingo"` devuelve solo `Apartamento Urbano 3H Plus`.

Datos esperados:

| Query | Resultados |
| --- | --- |
| `city: "Santo Domingo", bedrooms: 3` | 1: `Apartamento Urbano 3H Plus`, `priceFrom 7850000`, `DOP`, `availableUnits 2` |
| `location: "Santo Domingo", bedrooms: 3` | 2 potenciales por substring: `Apartamento Familiar 3H` y `Apartamento Urbano 3H Plus` |
| `location: "Distrito Nacional", bedrooms: 3, maximumPrice: 8000000` | 1: `Apartamento Urbano 3H Plus` |

`RECOMENDACIÓN`: para evitar ambigüedad del criterio escrito por el usuario, el parser de tool puede mapear “en Santo Domingo” a `location: "Santo Domingo"` para obtener 1-3 resultados, o a `city` si se decide que “Santo Domingo” significa municipio estricto.

`RECOMENDACIÓN`: no usar la conversación seed principal. Crear fixture temporal con `external_session_id` único, metadata `runId`, conversation state inicial y cleanup.

## 20. Gaps bloqueantes

- `BLOQUEANTE`: no existe endpoint para crear/resolver conversación.
- `BLOQUEANTE`: no existe mapping persistente `sessionKey -> conversationId`.
- `BLOQUEANTE`: `companyId` confiable no está en configuración del plugin ni resuelto por backend.
- `BLOQUEANTE`: no hay hooks confirmados para persistir mensaje de usuario y respuesta final automáticamente.
- `BLOQUEANTE`: no hay tool `search_properties` ni métodos client para rutas internas.
- `BLOQUEANTE`: no hay prueba runtime de visibilidad de la nueva tool porque aún no existe.

## 21. Gaps no bloqueantes

- endpoint atómico completo de turno si se confirma hook/wrapper suficiente;
- `compare_properties`;
- web chat real;
- assets avanzados;
- analytics;
- disponibilidad por unidad, que pertenece a 4C;
- skill comercial formal grande.

## 22. Decisiones recomendadas

1. Implementar `4B.0` antes de `4B.1`.
2. Guardar `companyId` fuera del modelo.
3. Resolver conversación por `sessionKey` en `agent-core`, usando `external_session_id`.
4. No exponer `conversationId` al modelo.
5. Implementar `search_properties` como tool visible con filtros comerciales, no con IDs internos.
6. Limitar resultados visibles a 3.
7. Persistir state después de búsqueda para guardar ids mostrados.
8. No prometer disponibilidad detallada hasta 4C.

## 23. Estructura de archivos a modificar

Para `4B.0`:

- `packages/shared/src/index.ts`: contratos de create/resolve conversation si se agrega endpoint.
- `apps/agent-core/src/repositories/conversation.repository.ts`: insert/upsert/find by external session.
- `apps/agent-core/src/services/conversation.service.ts`: create/resolve conversation + state inicial.
- `apps/agent-core/src/routes/internal/conversations.ts`: nueva ruta.
- `apps/agent-core/tests/**`: unit/integration para create/resolve.
- `openclaw-workspace/plugins/real-estate-tools/src/config.ts`: `companyId` privado si no lo resuelve backend.
- `openclaw-workspace/plugins/real-estate-tools/src/client/agent-core-client.ts`: métodos internos.

Para `4B.1`:

- `openclaw-workspace/plugins/real-estate-tools/src/tools/search-properties.ts`.
- `openclaw-workspace/plugins/real-estate-tools/src/index.ts`.
- `openclaw-workspace/plugins/real-estate-tools/src/types.ts`.
- `openclaw-workspace/plugins/real-estate-tools/openclaw.plugin.json`.
- `openclaw-workspace/plugins/real-estate-tools/tests/**`.
- `openclaw-workspace/TOOLS.md` o instrucciones mínimas equivalentes.

## 24. Plan de implementación paso a paso

### 4B.0 - prerrequisitos

1. Agregar contrato compartido para resolver/crear conversación por `externalSessionId`.
2. Implementar repository/service/ruta interna en `agent-core`.
3. Crear estado inicial junto con conversación.
4. Validar compañía activa o fija del MVP.
5. Agregar tests de idempotencia por `external_session_id`.
6. Confirmar hook OpenClaw posterior a respuesta; si no existe, definir endpoint/wrapper mínimo de turno.
7. Extender plugin config/contexto para obtener `companyId` y conversación sin modelo.

### 4B.1 - búsqueda

1. Agregar método `searchProperties` al client.
2. Crear tool `search_properties` con schema visible.
3. Adaptar backend result a resultado compacto.
4. Guardar búsqueda en state: preferencias + ids recomendados/recientes.
5. Persistir mensajes con idempotencia.
6. Actualizar instrucciones mínimas de Carlos.
7. Ejecutar tests unitarios, integración, smoke y runtime isolation.

## 25. Criterio de salida corregido

Criterio original:

```text
“Busco un apartamento de 3 habitaciones en Santo Domingo”
funciona end-to-end con datos reales.
```

Criterio corregido:

```text
En una sesión nueva de real-estate-agent, Carlos resuelve/crea conversación desde sessionKey, busca apartamentos de 3 habitaciones en Santo Domingo contra agent-core/Supabase, muestra 1-3 resultados reales sin inventar datos, guarda mensaje de usuario, respuesta, preferencias y property ids mostrados, y en el segundo turno entiende referencias como “esas”.
```

Para 4B no exigir disponibilidad detallada por unidad; eso queda para 4C.

## 26. Definition of Done

- `search_properties` visible solo para `real-estate-agent`.
- `agent_core_health` sigue funcionando.
- `main` no ve tools inmobiliarias.
- `companyId`, Bearer token, `conversationId` y `sessionKey` no son argumentos del modelo.
- conversación nueva se crea/resuelve por sesión.
- mensajes user/assistant se persisten con idempotencia.
- memoria guarda ubicación, habitaciones, tipo, etapa, ids recientes/recomendados.
- respuesta muestra máximo 3 resultados reales.
- cero resultados responde con prudencia.
- segundo turno usa los resultados previos.
- tests unitarios, integración y runtime pasan.

## 27. Evidencias con archivos y líneas

- Plugin registration: `openclaw-workspace/plugins/real-estate-tools/src/index.ts:5`.
- Tool actual `agent_core_health`: `openclaw-workspace/plugins/real-estate-tools/src/index.ts:13`.
- Contexto confiable: `openclaw-workspace/plugins/real-estate-tools/src/context.ts:4`.
- `sessionKey` extraído defensivamente: `openclaw-workspace/plugins/real-estate-tools/src/context.ts:24`.
- SDK local sin hooks generales: `openclaw-workspace/plugins/real-estate-tools/src/openclaw-sdk.d.ts:2`.
- Config `baseUrl` y token env var: `openclaw-workspace/plugins/real-estate-tools/src/config.ts:29`.
- Bearer token en request: `openclaw-workspace/plugins/real-estate-tools/src/client/request.ts:23`.
- Correlation ID: `openclaw-workspace/plugins/real-estate-tools/src/telemetry/correlation.ts:3`.
- Search input schema: `packages/shared/src/index.ts:136`.
- Search result schema: `packages/shared/src/index.ts:208`.
- Search route: `apps/agent-core/src/routes/internal/properties.ts:37`.
- Search service: `apps/agent-core/src/services/property-search.service.ts:16`.
- Search repository filters/order/limit: `apps/agent-core/src/repositories/property.repository.ts:30`.
- Context route: `apps/agent-core/src/routes/internal/conversations.ts:20`.
- State route: `apps/agent-core/src/routes/internal/conversations.ts:28`.
- Messages route: `apps/agent-core/src/routes/internal/conversations.ts:36`.
- Conversation context service: `apps/agent-core/src/services/conversation.service.ts:28`.
- State update service: `apps/agent-core/src/services/conversation.service.ts:108`.
- Message idempotency: `apps/agent-core/src/services/conversation.service.ts:191`.
- Conversation company validation on save message: `apps/agent-core/src/services/conversation.service.ts:187`.
- Tenant ownership validation: `apps/agent-core/src/services/ownership-validator.ts:18`.
- Internal auth middleware: `apps/agent-core/src/middleware/internal-auth.ts:4`.
- Failure envelope mapping: `apps/agent-core/src/middleware/error-handler.ts:50`.
- Conversation schema: `supabase/migrations/001_initial_schema.sql:456`.
- Message schema: `supabase/migrations/001_initial_schema.sql:478`.
- Conversation state schema: `supabase/migrations/001_initial_schema.sql:494`.
- External session unique index: `supabase/migrations/001_initial_schema.sql:680`.
- Seed company: `supabase/seed.sql:21`.
- Seed properties: `supabase/seed.sql:132`.
- Seed units availability: `supabase/seed.sql:260`.
- Seed conversation: `supabase/seed.sql:442`.
- Fixture creates conversation directly: `apps/agent-core/src/testing/supabase-test-fixture.ts:150`.
- Fixture creates state directly: `apps/agent-core/src/testing/supabase-test-fixture.ts:174`.
- Integration search tests: `apps/agent-core/tests/integration/supabase-services.integration.test.ts:16`.
- Internal API search smoke: `apps/agent-core/src/scripts/internal-api-smoke-test.ts:61`.
- Conversation guide one question/no inventar: `docs/conversation-guide.md:34`.
- Recommendation max 1-3: `docs/sales-flow.md:76`.
- Tool map places availability in 4C-like separate tool: `docs/tool-map.md:64`.
- Architecture boundary: `docs/research/openclaw-phase4-complete-architecture.md:20`.

## 28. Comandos ejecutados y resultados resumidos

| Comando | Resultado |
| --- | --- |
| `sed -n ... pasted-text.txt` | Se leyó el encargo completo. |
| `rg --files ...` | Se ubicaron archivos de workspace, plugin, backend, docs y Supabase. |
| `find openclaw-workspace/plugins/real-estate-tools ...` | Se confirmó estructura 4A. |
| `nl -ba ... src/index.ts/config.ts/context.ts/...` | Se inspeccionó registro de tool, config, contexto, client y manifest. |
| `nl -ba packages/shared/src/index.ts` | Se extrajeron schemas reales. |
| `nl -ba apps/agent-core/src/routes/internal/*.ts` | Se confirmaron rutas internas reales. |
| `nl -ba apps/agent-core/src/services/*.ts` | Se revisó lógica de búsqueda, conversación y ownership. |
| `nl -ba apps/agent-core/src/repositories/*.ts` | Se revisó acceso a Supabase y ausencia de create conversation público. |
| `nl -ba supabase/migrations/001_initial_schema.sql` | Se verificó esquema de tablas e índices. |
| `nl -ba supabase/seed.sql` | Se confirmaron datos demo. |
| `rg -n conversation/session/company...` | Se buscó mapping, endpoints y web chat. |
| `nl -ba apps/web-chat/src/App.tsx` | Se confirmó scaffold sin sesión/conversación. |

## Tabla final

| Área | Estado | Evidencia | Bloqueante | Acción |
| ---- | ------ | --------- | ---------- | ------ |
| Plugin 4A | CONFIRMADO | `src/index.ts:5` | No | Añadir segunda tool sin tocar health. |
| Contexto runtime | INFERIDO/CONFIRMADO parcial | `context.ts:4`, `openclaw-sdk.d.ts:2` | Sí | Validar `sessionKey` en runtime 4B.0. |
| Search backend | CONFIRMADO | `properties.ts:37`, `property-search.service.ts:16` | No | Reutilizar contrato real. |
| `companyId` | NO ENCONTRADO en config | `config.ts:3`, `seed.sql:21` | Sí | Resolver por config privada o endpoint. |
| Crear conversación | NO ENCONTRADO | `conversations.ts:20`, fixture directo `supabase-test-fixture.ts:150` | Sí | Agregar resolve/create interno. |
| Mapping sesión | NO ENCONTRADO como flujo | índice `001_initial_schema.sql:680` | Sí | Usar `external_session_id`. |
| Persistencia mensajes | CONFIRMADO ruta, BLOQUEANTE automatización | `conversation.service.ts:183` | Sí | Hook/wrapper/turn endpoint. |
| Contexto | CONFIRMADO | `conversation.service.ts:28` | No | Cargar antes de cada turno. |
| Estado/memoria | CONFIRMADO, sin optimistic concurrency | `conversation.service.ts:108` | No para MVP | Patch después de búsqueda. |
| Disponibilidad | CONFIRMADO conteo en search | `property-search.service.ts:27` | No | No adelantar detalle 4C. |
| Skill | NO BLOQUEANTE | `AGENTS.md:9`, `TOOLS.md:5` | No | Instrucciones mínimas. |
| Endpoint atómico | NO ENCONTRADO | rutas actuales | Condicional | Solo si no hay hook confiable. |
| Datos demo | CONFIRMADO | `seed.sql:132`, `seed.sql:260` | No | Usar fixture temporal, no seed conversation. |

DECISIÓN:
IMPLEMENTAR PRIMERO 4B.0

# Fase 4B.1 - search_properties

## Objetivo

Implementar la primera tool inmobiliaria real de OpenClaw para Carlos:

- `search_properties`
- Backend: `POST /internal/properties/search`
- Datos reales via `agent-core`, no acceso directo a Supabase desde OpenClaw.

## Alcance

Esta fase queda limitada a busqueda de opciones de inventario. No implementa referencia de propiedades, detalle, disponibilidad especifica por unidad, media, documentos, planes de pago, comparacion, leads, visitas, handoff, web-chat ni skill comercial completo.

El plugin expone exactamente:

- `agent_core_health`
- `search_properties`

## Contrato visible

`search_properties` solo acepta filtros comerciales:

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

El schema visible usa `additionalProperties: false`; `limit` tiene default `3`, minimo `1` y maximo `3`.

Quedan bloqueados campos internos como `companyId`, `conversationId`, `sessionKey`, `sessionId`, `agentId`, `toolCallId`, `baseUrl`, `token`, `correlationId`, `propertyId`, `developmentId`, `listingId` y `unitId`.

## Contexto confiable

La tool construye el contexto desde el runtime de OpenClaw:

- exige `agentId = real-estate-agent`;
- exige `sessionKey`;
- resuelve o crea conversacion con `resolveTrustedConversation`;
- carga memoria con `loadTrustedConversationContext`;
- usa `companyId` solo desde configuracion privada y respuesta confiable de `agent-core`;
- nunca acepta `companyId`, `conversationId`, `sessionKey`, `baseUrl` ni token desde el modelo.

## Merge con memoria

Los argumentos explicitos ganan sobre memoria. Cuando faltan, se usan:

- `preferredLocations[0] -> location`
- `bedrooms`
- `bathrooms`
- `parkingSpaces`
- `propertyTypes[0] -> propertyType`
- `maximumBudget -> maximumPrice`
- `currency`
- `importantAmenities -> amenities`

No se transforma `Santo Domingo` en `city`; si el usuario lo expresa como criterio principal se conserva como `location`.

## Resultado compacto

La respuesta al modelo contiene:

- `ok`
- `zeroResults`
- `appliedFilters`
- `results` con indice, nombre, proyecto, ubicacion comercial, sector, ciudad, habitaciones, banos, parqueos, areas, precios, moneda, `availableUnits`, imagen, resumen y features.

`propertyId` permanece en la respuesta estructurada para seguimiento interno, pero Carlos no debe mostrar UUIDs al cliente.

La respuesta no incluye `companyId`, `conversationId`, `sessionKey`, `sessionId`, `agentId`, `correlationId`, `baseUrl`, endpoints, token, `lastVerifiedAt`, `developmentId`, payload crudo, metadata de Supabase, storage paths ni timestamps.

## Persistencia

Despues de cada busqueda se hace un solo `PATCH` de estado:

- preferencias conocidas: ubicacion, habitaciones, banos, parqueos, tipo, presupuesto maximo, moneda y amenities;
- `lastCustomerIntent = property_search`;
- si hay resultados: `salesStage = RECOMMENDATION`, `recommendedPropertyIds`, `recentPropertyIds`;
- si no hay resultados: `salesStage = DISCOVERY`, sin persistir arrays vacios de propiedades.

Si el runtime expone el texto original del usuario, la tool lo persiste como mensaje `user`. Si OpenClaw no lo entrega en el contexto de ejecucion, no reconstruye el mensaje desde filtros y solo continua la busqueda.

## Smoke

El paquete del plugin incluye:

```bash
pnpm --filter @real-estate-agent/openclaw-real-estate-tools smoke:search-properties
```

El smoke:

- verifica `/health`;
- resuelve una conversacion temporal;
- carga contexto;
- busca `location: "Santo Domingo"`, `bedrooms: 3`, `propertyType: "apartment"`, `limit: 3`;
- actualiza memoria;
- recarga contexto;
- limpia datos temporales por `runId`;
- compara snapshot de seed para confirmar que no cambio.

## Validaciones

Validaciones locales esperadas:

- `pnpm --filter @real-estate-agent/shared build`
- `pnpm --filter @real-estate-agent/agent-core typecheck`
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck`
- `pnpm --filter @real-estate-agent/agent-core test:unit`
- `pnpm --filter @real-estate-agent/agent-core test:integration`
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools test`
- `pnpm --filter @real-estate-agent/agent-core smoke:conversation-bootstrap`
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools smoke:health`
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools smoke:search-properties`
- `openclaw plugins inspect real-estate-tools --runtime --json`
- `openclaw health`

## Limitaciones

- La tool no confirma disponibilidad de una unidad especifica.
- `availableUnits` es un conteo general agregado por el backend.
- La tool no envia archivos ni crea leads, visitas o handoffs.
- La continuidad conversacional depende de que el runtime entregue `sessionKey`.

## Siguiente fase

`Fase 4C - referencia de propiedades, detalles y disponibilidad especifica.`

# Arquitectura

## Vista General

```text
Usuario
  -> Carlos / OpenClaw
  -> plugin real-estate-tools
  -> agent-core HTTP
  -> servicios de dominio
  -> repositorios
  -> Supabase
```

## Responsabilidades

### OpenClaw

OpenClaw ejecuta la conversacion y expone tools al agente `real-estate-agent`. No es la fuente de verdad y no debe acceder a Supabase directamente.

Contenido relevante:

- `openclaw-workspace/IDENTITY.md`
- `openclaw-workspace/SOUL.md`
- `openclaw-workspace/TOOLS.md`
- `openclaw-workspace/skills/real-estate-sales-advisor/SKILL.md`
- `openclaw-workspace/plugins/real-estate-tools`

### Plugin `real-estate-tools`

Vive en:

```text
openclaw-workspace/plugins/real-estate-tools
```

Responsabilidades:

- declarar tools para OpenClaw;
- validar argumentos visibles al modelo;
- resolver contexto confiable del agente y sesion;
- llamar a `agent-core` por HTTP;
- aplicar logging seguro y redaccion;
- preservar aislamiento de `real-estate-agent`.

Tools actuales:

- `agent_core_health`
- `search_properties`
- `get_property_assets`

### Agent Core

Vive en:

```text
apps/agent-core
```

Responsabilidades:

- autenticacion de rutas internas;
- validacion de contratos;
- reglas de negocio;
- presentacion segura de DTOs;
- conversacion y memoria;
- leads, visitas y handoff;
- acceso a Supabase mediante servicios y repositorios.

Rutas internas principales:

```text
POST /internal/properties/resolve-reference
POST /internal/properties/search
GET  /internal/properties/:propertyId
GET  /internal/properties/:propertyId/availability
POST /internal/properties/:propertyId/media
POST /internal/properties/:propertyId/documents
GET  /internal/properties/:propertyId/payment-plan
GET  /internal/companies/:companyId/information
POST /internal/conversations/resolve
GET  /internal/conversations/:conversationId/context
PATCH /internal/conversations/:conversationId/state
POST /internal/conversations/:conversationId/messages
POST /internal/leads
POST /internal/visits
POST /internal/handoffs
```

### Packages Shared

Vive en:

```text
packages/shared
```

Contiene schemas Zod, DTOs, enums, contratos de entrada/salida y metadata compartida.

Antes de crear tipos nuevos, revisa `packages/shared/src/index.ts`.

### Supabase

Vive en:

```text
supabase
```

Supabase es la fuente de verdad para:

- inventario;
- desarrollos;
- unidades/listings;
- medios y documentos;
- conversaciones;
- leads;
- visitas;
- handoffs;
- eventos.

## Reglas de Frontera

- OpenClaw nunca consulta Supabase directamente.
- El modelo no recibe ni debe revelar UUIDs, tokens, endpoints internos o detalles de tablas.
- Toda accion de negocio pasa por `agent-core`.
- El plugin no debe implementar reglas comerciales que ya vivan en `agent-core`.
- `real-estate-agent` debe permanecer aislado de `main`.

## Flujo de Busqueda de Propiedades

1. El usuario pide propiedades.
2. Carlos usa `search_properties`.
3. El plugin valida argumentos y contexto.
4. El plugin llama `POST /internal/properties/search`.
5. `agent-core` valida, busca en repositorios y actualiza estado conversacional.
6. El plugin devuelve resultados seguros al modelo.
7. Carlos presenta opciones, recomienda una y, si corresponde, usa `get_property_assets`.


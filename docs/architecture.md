# Arquitectura

## Vista General

El sistema tiene dos fronteras HTTP separadas:

```text
Interfaz web
  -> Agent Core /public/*
  -> OpenClaw CLI
  -> Carlos / real-estate-agent
  -> plugin real-estate-tools
  -> Agent Core /internal/*
  -> servicios de dominio
  -> repositorios
  -> Supabase
```

El flujo directo de Carlos continúa siendo:

```text
Usuario
  -> Carlos / OpenClaw
  -> plugin real-estate-tools
  -> Agent Core /internal/*
  -> servicios de dominio
  -> repositorios
  -> Supabase
```

## Frontera Pública

La interfaz consume solamente:

```text
GET  /public/health
POST /public/chat
```

Responsabilidades:

- validar el contrato web;
- generar o reutilizar un `sessionId` público;
- construir internamente la sesión de OpenClaw;
- ejecutar el agente fijo `real-estate-agent`;
- normalizar texto y medios;
- filtrar URLs locales o inseguras;
- ocultar metadata interna;
- aplicar CORS, rate limit, concurrencia, timeout y headers de seguridad.

La sesión interna se construye exclusivamente en Agent Core:

```text
agent:real-estate-agent:web-<sessionId>
```

El navegador nunca puede enviar ni decidir:

```text
sessionKey
agentId
provider
model
usage
tokens
workspaceDir
runId
systemPromptReport
```

## Frontera Interna

Las rutas `/internal/*` continúan protegidas con Bearer token y son consumidas por el plugin `real-estate-tools`.

Rutas principales:

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

## Web Chat

La interfaz vive en:

```text
apps/web-chat
```

Flujo del navegador:

```text
Usuario
  -> React Web Chat
  -> GET /public/health
  -> POST /public/chat
  -> Agent Core
  -> OpenClaw
  -> Carlos
```

El frontend no conoce la sesión interna de OpenClaw. Solo conserva el identificador público devuelto por Agent Core:

```text
real-estate-agent-public-session-id
```

La persistencia usa `localStorage`. Al seleccionar “Nueva conversación”, el frontend elimina ese identificador y el siguiente mensaje crea una sesión nueva.

El frontend valida las respuestas mediante los contratos compartidos:

```text
publicHealthResponseSchema
publicChatResponseSchema
```

La URL de Agent Core se resuelve desde:

```text
VITE_AGENT_CORE_URL
```

y usa `http://127.0.0.1:8787` como fallback local.


## OpenClaw Agent Client

Archivo:

```text
apps/agent-core/src/integrations/openclaw/openclaw-agent.client.ts
```

Características:

- usa `spawn`, nunca `exec`;
- pasa argumentos separados;
- usa un agente fijo;
- aplica timeout;
- limita stdout y stderr;
- valida JSON con Zod;
- extrae únicamente contenido visible;
- usa `result.meta.finalAssistantVisibleText` como fallback;
- nunca devuelve el JSON completo de OpenClaw.

El CLI real puede devolver:

```json
{
  "text": "Respuesta visible",
  "mediaUrl": null
}
```

Por eso el schema interno acepta `null` para esos campos.

## Public Chat Service

Archivo:

```text
apps/agent-core/src/services/public-chat.service.ts
```

Responsabilidades:

- generar UUID público;
- reutilizar sesiones válidas;
- llamar al cliente OpenClaw;
- construir una respuesta estable;
- permitir solamente URLs HTTP o HTTPS públicas;
- rechazar `file://`, localhost, loopback, redes privadas y URLs con credenciales.

## Middleware Público

Archivo:

```text
apps/agent-core/src/middleware/public-security.ts
```

Controles:

- allowlist CORS;
- límite real del body en bytes;
- rate limit en memoria;
- concurrencia máxima;
- timeout;
- request ID;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- `Cache-Control: no-store`.

Con `PUBLIC_CHAT_TRUST_PROXY=false`, no se confía en headers de IP enviados por el cliente.

## OpenClaw

OpenClaw ejecuta la conversación y expone tools al agente `real-estate-agent`. No es la fuente de verdad y no accede directamente a Supabase.

Contenido relevante:

```text
openclaw-workspace/IDENTITY.md
openclaw-workspace/SOUL.md
openclaw-workspace/TOOLS.md
openclaw-workspace/skills/real-estate-sales-advisor/SKILL.md
openclaw-workspace/plugins/real-estate-tools
```

## Plugin `real-estate-tools`

Responsabilidades:

- declarar tools;
- validar argumentos;
- resolver contexto confiable;
- llamar a `/internal/*`;
- aplicar logging seguro;
- preservar el aislamiento del agente.

Tools actuales:

```text
agent_core_health
search_properties
get_property_assets
```

## Packages Shared

`packages/shared` contiene los contratos públicos e internos.

Contrato público:

```text
packages/shared/src/public-chat.ts
```

## Supabase

Supabase es la fuente de verdad para inventario, unidades, medios, documentos, conversaciones, leads, visitas, handoffs y eventos.

## Reglas de Frontera

- El navegador solo consume `/public/*`.
- OpenClaw Gateway no se expone públicamente.
- `/internal/*` requiere autenticación.
- OpenClaw no consulta Supabase directamente.
- Toda regla comercial vive en Agent Core.
- `real-estate-agent` permanece aislado de `main`.

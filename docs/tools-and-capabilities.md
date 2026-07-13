# Tools y Capacidades

Esta página separa:

- lo que puede usar Carlos;
- lo que expone Agent Core internamente;
- lo que puede consumir una interfaz web mediante el backend público.

## Interfaz Web

La interfaz web no usa tools de OpenClaw directamente.

Consume:

```text
GET  /public/health
POST /public/chat
```

La interfaz puede enviar:

```json
{
  "message": "Busco un apartamento en Villa Mella"
}
```

o continuar una conversación:

```json
{
  "sessionId": "public-session-id",
  "message": "Mi presupuesto es RD$8,000,000"
}
```

La respuesta pública contiene únicamente:

- `sessionId`;
- mensaje visible;
- payloads de texto;
- payloads de medios públicos HTTP o HTTPS.

No expone:

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

## Disponible Actualmente Para Carlos

### `agent_core_health`

Verifica que Agent Core responda.

Uso esperado:

- diagnóstico rápido;
- confirmar que el backend está activo;
- validar conectividad antes de usar tools de negocio.

### `search_properties`

Busca inventario real mediante Agent Core.

Filtros visibles principales:

- `location`;
- `city`;
- `sector`;
- `bedrooms`;
- `bathrooms`;
- `parkingSpaces`;
- `minPrice`;
- `maxPrice`;
- `currency`;
- `propertyType`;
- `amenities`;
- `availability`;
- `limit`.

Reglas actuales:

- devuelve tres opciones por defecto;
- permite hasta diez cuando el cliente pide una lista completa;
- `location: "Santo Domingo"` representa Gran Santo Domingo;
- `city` conserva semántica estricta.

### `get_property_assets`

Obtiene enlaces asociados a una propiedad.

Categorías posibles:

- `cover_image`;
- `property_gallery`;
- `exterior_gallery`;
- `interior_gallery`;
- `amenities_gallery`;
- `floor_plan`;
- `video`;
- `virtual_tour`;
- `brochure`;
- `payment_plan`;
- `price_list`;
- `location_map`;
- `reservation_requirements`.

Reglas comerciales:

- para hasta tres propiedades, Carlos debe solicitar una imagen representativa por propiedad;
- en listas mayores, solo obtiene recursos para las destacadas;
- no revela `propertyId`;
- no afirma que adjuntó archivos si solo comparte enlaces.

## Normalización de Respuestas de OpenClaw

OpenClaw puede devolver:

```json
{
  "payloads": [
    {
      "text": "Respuesta visible",
      "mediaUrl": null
    }
  ]
}
```

Agent Core normaliza esto como payload de texto.

Cuando `mediaUrl` contiene una URL pública válida, se puede producir:

```json
{
  "type": "media",
  "url": "https://example.com/image.jpg"
}
```

URLs rechazadas:

- `file://`;
- localhost;
- loopback;
- redes privadas;
- URLs con usuario o contraseña;
- rutas locales.

## Disponible en Agent Core

### Propiedades

```text
POST /internal/properties/resolve-reference
POST /internal/properties/search
GET  /internal/properties/:propertyId
GET  /internal/properties/:propertyId/availability
POST /internal/properties/:propertyId/media
POST /internal/properties/:propertyId/documents
GET  /internal/properties/:propertyId/payment-plan
```

### Conversaciones

```text
POST /internal/conversations/resolve
GET  /internal/conversations/:conversationId/context
PATCH /internal/conversations/:conversationId/state
POST /internal/conversations/:conversationId/messages
```

### Conversión

```text
POST /internal/leads
POST /internal/visits
POST /internal/handoffs
```

### Empresa

```text
GET /internal/companies/:companyId/information
```

## Seguridad de Capacidades

La arquitectura impone estas fronteras:

- el navegador no llama a OpenClaw Gateway;
- el navegador no llama a `/internal/*`;
- OpenClaw no consulta Supabase directamente;
- el plugin solo recibe las capacidades necesarias;
- Agent Core fija el agente `real-estate-agent`;
- el navegador no puede elegir agente ni sesión interna;
- las respuestas públicas se validan con schemas estrictos;
- la metadata interna se descarta.

## Regla Para Nuevas Tools

Antes de crear una tool nueva:

1. confirmar que el contrato existe;
2. implementar la lógica en Agent Core;
3. agregar schemas en `packages/shared` cuando corresponda;
4. exponer al plugin solo el mínimo necesario;
5. preservar el aislamiento de `real-estate-agent`;
6. validar que `main` no reciba la tool;
7. añadir tests unitarios e integración;
8. comprobar que la respuesta pública no expone metadata interna.

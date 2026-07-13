# Tools y Capacidades

Esta pagina separa lo que existe en `agent-core` de lo que Carlos puede usar actualmente como tool.

## Disponible Actualmente Para Carlos

### `agent_core_health`

Verifica que `agent-core` responda.

Uso esperado:

- diagnostico rapido;
- confirmar que el backend esta activo antes de usar tools de negocio.

### `search_properties`

Busca inventario real mediante `agent-core`.

Filtros visibles principales:

- `location`
- `city`
- `sector`
- `bedrooms`
- `bathrooms`
- `parkingSpaces`
- `minPrice`
- `maxPrice`
- `currency`
- `propertyType`
- `amenities`
- `availability`
- `limit`

Reglas actuales:

- devuelve 3 opciones por defecto;
- permite hasta 10 cuando el cliente pide todas, todo el inventario o lista completa;
- `location: "Santo Domingo"` representa Gran Santo Domingo;
- `city` conserva semantica estricta.

### `get_property_assets`

Obtiene hasta 3 enlaces JPG, PNG o PDF asociados a una propiedad.

Categorias posibles:

- `cover_image`
- `property_gallery`
- `exterior_gallery`
- `interior_gallery`
- `amenities_gallery`
- `floor_plan`
- `video`
- `virtual_tour`
- `brochure`
- `payment_plan`
- `price_list`
- `location_map`
- `reservation_requirements`

Reglas comerciales:

- cuando Carlos presenta hasta 3 propiedades, debe pedir una imagen representativa por propiedad;
- en listas mayores de 3, solo consulta recursos para las 3 destacadas o la recomendada;
- no debe revelar `propertyId`;
- no debe afirmar que adjunto o envio archivos.

## Disponible En Agent Core

`agent-core` ya tiene rutas y servicios para mas capacidades que las tools actuales de Carlos.

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

### Conversion

```text
POST /internal/leads
POST /internal/visits
POST /internal/handoffs
```

### Empresa

```text
GET /internal/companies/:companyId/information
```

## Regla Para Nuevas Tools

Antes de crear una tool nueva:

1. confirma que el contrato existe o documenta el hueco;
2. implementa la logica de negocio en `agent-core`, no en OpenClaw;
3. agrega tipos o schemas en `packages/shared` si corresponde;
4. expone en el plugin solo el minimo necesario para el modelo;
5. conserva aislamiento de `real-estate-agent`;
6. valida que `main` no reciba la tool.


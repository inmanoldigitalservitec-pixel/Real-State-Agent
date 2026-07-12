# Memory Map

## Objetivo

Definir la memoria oficial que el asesor debe mantener durante una conversación para sostener continuidad comercial, evitar repeticiones y habilitar handoff humano con contexto.

## Grupos de memoria

### 1. Identidad del cliente

```text
customer_name
phone
email
preferred_contact_method
```

Regla:
- estos datos se capturan solo cuando existe interés real o una acción comercial concreta.

### 2. Preferencias inmobiliarias

```text
preferred_locations
rejected_locations
bedrooms
bathrooms
parking_spaces
property_types
minimum_area_m2
maximum_budget
currency
important_amenities
delivery_preference
```

### 3. Contexto comercial

```text
purchase_purpose
financing_required
purchase_timeline
main_objections
lead_temperature
sales_stage
```

### 4. Propiedades

```text
active_property_id
interested_property_ids
recommended_property_ids
viewed_property_ids
rejected_property_ids
recent_property_ids
```

### 5. Assets

```text
sent_asset_ids
sent_brochure_ids
sent_floor_plan_ids
sent_payment_plan_ids
```

### 6. Conversación

```text
last_customer_intent
last_agent_question
pending_question
conversation_summary
source_channel
source_listing_id
source_property_id
```

### 7. Visita y handoff

```text
visit_requested
preferred_visit_date
preferred_visit_time
handoff_requested
handoff_reason
assigned_agent
```

## Campos mínimos obligatorios

Además de los grupos anteriores, la implementación futura debe contemplar como mínimos:
- `active_property_id`;
- `main_objections`;
- `pending_question`;
- `conversation_summary`;
- `source_property_id`;
- `handoff_reason`.

## Reglas operativas

- Mantener una sola propiedad activa a la vez.
- No recomendar propiedades rechazadas.
- Actualizar la memoria después de cada turno.
- Resumir conversaciones largas para conservar contexto sin sobrecargar el historial.
- No capturar datos personales hasta que exista interés real.
- Mantener registro de la última pregunta del agente para no repetirla.
- Mantener una pregunta pendiente cuando la conversación quedó abierta.
- Recordar los últimos inmuebles mostrados.
- Recordar qué assets fueron enviados.
- Recordar objeciones ya expresadas.

## Comportamientos derivados de la memoria

### Propiedad activa

Si el cliente dice:

> Mándame más fotos.

El sistema debe usar `active_property_id` para evitar pedir aclaración innecesaria.

### Rechazo de propiedad

Si el cliente rechaza una propiedad:
- agregarla a `rejected_property_ids`;
- no incluirla otra vez en recomendaciones futuras salvo solicitud explícita.

### Cambio de preferencia

Si el cliente cambia de zona o presupuesto:
- actualizar preferencia vigente;
- conservar el cambio en la memoria;
- no seguir usando el criterio anterior como si fuera actual.

### Assets enviados

Si ya se compartió un brochure o plan de pago:
- registrarlo en memoria;
- no ofrecerlo de nuevo por defecto;
- reenviarlo solo si el cliente lo pide.

### Handoff

Si la conversación pasa a humano:
- registrar `handoff_requested = true`;
- guardar `handoff_reason`;
- conservar `conversation_summary` con contexto útil.

## Resumen de diseño

La memoria del MVP debe servir para tres cosas:
- conversar con continuidad;
- tomar mejores decisiones comerciales;
- entregar un contexto claro al asesor humano cuando corresponda.

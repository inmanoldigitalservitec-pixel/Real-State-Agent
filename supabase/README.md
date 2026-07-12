# Supabase

Este directorio define la base de datos y storage del MVP inmobiliario. En esta fase no conecta todavía con OpenClaw, no implementa tools y no toca la UI; solo deja el modelo de datos, políticas y datos de demostración listos para revisión.

## Archivos

- [config.toml](/Users/inma/Documents/Real%20State%20Agent/supabase/config.toml)
- [migrations/001_initial_schema.sql](/Users/inma/Documents/Real%20State%20Agent/supabase/migrations/001_initial_schema.sql)
- [migrations/002_rls_and_policies.sql](/Users/inma/Documents/Real%20State%20Agent/supabase/migrations/002_rls_and_policies.sql)
- [migrations/003_storage.sql](/Users/inma/Documents/Real%20State%20Agent/supabase/migrations/003_storage.sql)
- [seed.sql](/Users/inma/Documents/Real%20State%20Agent/supabase/seed.sql)

## Criterio de diseño

Los documentos de `/docs` son la fuente de verdad funcional. A partir de ellos, el esquema cubre cuatro áreas:

- Catálogo inmobiliario: empresa, proyectos, modelos, unidades, amenidades, assets, documentos y anuncios.
- Comercial: planes de pago vigentes, preguntas frecuentes y contexto de publicaciones.
- Conversación: conversaciones, mensajes, memoria conversacional y eventos del agente.
- Conversión: leads y solicitudes de visita.

## Relación principal del catálogo

```text
companies
  └─ developments
       └─ properties
            └─ property_units
```

Separación aplicada:
- `developments`: proyecto inmobiliario.
- `properties`: modelo o tipología comercial.
- `property_units`: unidad física disponible, reservada o vendida.

## Tablas incluidas

### Catálogo

- `companies`
- `developments`
- `properties`
- `property_units`
- `property_amenities`
- `property_media`
- `property_documents`
- `property_listings`
- `company_faqs`

### Comercial

- `payment_plans`
- `payment_plan_items`

### Conversacional

- `conversations`
- `messages`
- `conversation_state`
- `agent_events`

### Conversión

- `leads`
- `visit_requests`

## Decisiones importantes

- Todas las claves primarias usan UUID.
- Las tablas mutables incluyen `created_at` y `updated_at`.
- `conversation_state` cubre explícitamente los campos del `memory-map.md`, incluyendo:
  - identidad del cliente;
  - preferencias inmobiliarias;
  - contexto comercial;
  - propiedad activa;
  - listas de propiedades vistas/rechazadas/recomendadas;
  - assets enviados;
  - resumen, pregunta pendiente y motivo de handoff.
- `payment_plans` y `payment_plan_items` separan plan maestro de cuotas/etapas.
- Los planes de pago guardan vigencia con `valid_from`, `valid_to` y `last_verified_at`.
- Los assets guardan `bucket_name`, `storage_path`, `asset_type`, `category` y `sort_order`.
- `property_listings` vincula anuncios o publicaciones externas con propiedades y unidades concretas.

## RLS y acceso

La política base es:

- `service_role` puede administrar todas las tablas.
- El catálogo público de lectura queda abierto para `select` según reglas de visibilidad:
  - compañías activas;
  - proyectos y propiedades activas;
  - listings publicados;
  - documentos no vencidos;
  - planes de pago activos y vigentes.
- Conversaciones, memoria, leads, visitas y eventos quedan cerrados al backend por ahora.

Esto sigue la arquitectura prevista: el frontend no hablará directamente con Supabase para lógica sensible.

## Storage

La migración de storage crea estos buckets:

- `property-images`
- `property-documents`
- `property-videos`
- `company-assets`

Los buckets quedan públicos para lectura de assets demo y reservados al `service_role` para escritura.

## Seed de demostración

`seed.sql` carga:

- 1 empresa demo;
- 3 proyectos;
- 4 modelos de propiedad;
- 12 unidades con estados mixtos;
- amenidades, media, documentos y listings;
- FAQs;
- planes de pago vigentes y uno expirado;
- una conversación de ejemplo con memoria, lead, visita y eventos.

Esto permite validar desde ya búsquedas por:

- zona;
- precio;
- habitaciones;
- disponibilidad;
- assets;
- brochure;
- plan de pago;
- contexto de publicación.

## Siguiente revisión

Antes de aplicar al proyecto remoto de Supabase, conviene revisar:

- si algún enum comercial necesita más valores;
- si `property_media` y `property_documents` deben admitir un cuarto scope adicional en el futuro;
- si `property_listings` necesita más metadatos por canal;
- si `conversation_state` debe seguir 100% explícito o mover parte de la memoria a JSONB en fases posteriores.

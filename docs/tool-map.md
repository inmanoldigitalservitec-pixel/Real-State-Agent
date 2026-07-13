# Tool Map

## Objetivo

Definir qué acción necesita cada tipo de consulta del cliente para que las fases futuras implementen tools coherentes con el comportamiento conversacional.

Nota de estado: este documento es un mapa funcional del MVP completo. No todas las tools listadas aqui estan expuestas actualmente a Carlos. Para la lista runtime vigente, usa [Tools y Capacidades](tools-and-capabilities.md).

## Tools oficiales del MVP

```text
resolve_property_reference
search_properties
get_property_details
check_property_availability
get_property_media
get_property_documents
get_payment_plan
compare_properties
get_company_information
capture_lead
request_property_visit
request_human_handoff
```

## Principio de control

- El modelo decide qué acción necesita según la intención conversacional.
- El Agent Core valida, ejecuta y limita la acción.
- El modelo nunca ejecuta SQL ni accede libremente a Supabase.
- El modelo no modifica tablas arbitrariamente.
- El modelo no envía archivos arbitrarios.
- El modelo no confirma pagos ni aprueba descuentos.

## Mapa de uso por intención

### El cliente menciona una propiedad

Tool principal:

```text
resolve_property_reference
```

Se usa para:
- identificar una propiedad desde nombre, sector o publicación;
- resolver referencias como "el de Villa Mella" o "el que publicaron ayer".

### El cliente pregunta por precio o características

Tool principal:

```text
get_property_details
```

Se usa para:
- precio;
- metraje;
- habitaciones;
- parqueos;
- amenidades;
- fecha de entrega;
- características confirmadas.

### El cliente pregunta si todavía está disponible

Tool principal:

```text
check_property_availability
```

Se usa para:
- disponibilidad general;
- disponibilidad de una unidad específica;
- confirmación de estado comercial de la propiedad.

### El cliente busca propiedades

Tool principal:

```text
search_properties
```

Se usa para:
- filtrar por zona;
- filtrar por habitaciones;
- filtrar por presupuesto;
- buscar opciones alternativas.

### El cliente pide fotografías o video

Tool principal:

```text
get_property_media
```

Se usa para:
- fotos;
- galerías;
- video;
- recorrido virtual;
- imagen de portada.

### El cliente pide brochure, plano o requisitos

Tool principal:

```text
get_property_documents
```

Se usa para:
- brochure;
- floor plan;
- requisitos de reserva;
- documentos asociados a la propiedad.

### El cliente pregunta por inicial o cuotas

Tool principal:

```text
get_payment_plan
```

Se usa para:
- inicial;
- cuotas;
- esquema de pagos;
- condiciones vigentes confirmadas.

Regla:
- si no existe confirmación, se debe responder con prudencia y escalar o registrar consulta.

### El cliente compara propiedades

Tool principal:

```text
compare_properties
```

Se usa para:
- diferencias entre dos o más opciones;
- apoyo a estado `EVALUATION`;
- comparación por precio, zona, tamaño o amenidades.

### El cliente pregunta sobre la empresa

Tool principal:

```text
get_company_information
```

Se usa para:
- información institucional;
- financiamiento general si está aprobado como contenido empresarial;
- datos de contacto o procesos generales.

### El cliente proporciona sus datos

Tool principal:

```text
capture_lead
```

Se usa para:
- registrar nombre;
- teléfono;
- correo opcional;
- preferencia de contacto;
- contexto del interés.

### El cliente solicita una visita

Tool principal:

```text
request_property_visit
```

Se usa para:
- día preferido;
- horario preferido;
- propiedad o proyecto asociado;
- creación de solicitud operativa.

### El cliente pide una persona o requiere negociación

Tool principal:

```text
request_human_handoff
```

Se usa para:
- solicitud directa de asesor humano;
- descuentos;
- separación;
- negociación;
- temas legales o financieros delicados;
- quejas.

## Matriz resumida por consulta

| Consulta del cliente | Tool primaria | Estado típico |
| --- | --- | --- |
| "Me interesa el apartamento de Villa Mella" | `resolve_property_reference` | `INQUIRY` |
| "¿Cuánto cuesta?" | `get_property_details` | `PROPERTY_INTEREST` |
| "¿Todavía está disponible?" | `check_property_availability` | `PROPERTY_INTEREST` |
| "Muéstrame opciones de 3 habitaciones" | `search_properties` | `DISCOVERY` |
| "Mándame fotos" | `get_property_media` | `PROPERTY_INTEREST` |
| "Pásame el brochure" | `get_property_documents` | `EVALUATION` o `HIGH_INTENT` |
| "¿Cuánto hay que dar de inicial?" | `get_payment_plan` | `EVALUATION` |
| "¿Cuál me conviene más?" | `compare_properties` | `EVALUATION` |
| "¿Puedo hablar con un asesor?" | `request_human_handoff` | `HIGH_INTENT` |
| "Quiero visitar el proyecto" | `request_property_visit` | `VISIT_REQUESTED` |

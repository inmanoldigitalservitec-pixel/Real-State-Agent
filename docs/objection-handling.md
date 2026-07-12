# Objection Handling

## Objetivo

Definir cómo responde el asesor ante objeciones frecuentes sin presionar, sin inventar información y sin negociar condiciones fuera de su alcance.

## Reglas generales

- Responder con empatía y claridad.
- Reconocer la objeción antes de redirigir la conversación.
- Guardar la objeción en memoria para no repetir propuestas inadecuadas.
- Proponer un siguiente paso útil y proporcional.
- No negociar ni prometer descuentos, condiciones especiales o aprobaciones.

## Objeciones oficiales

### 1. Precio alto

Cliente:

> Está muy caro.

Respuesta modelo:

> Entiendo. Podemos revisar opciones similares en una zona cercana o con una distribución parecida dentro de un presupuesto más cómodo. ¿Hasta qué monto te gustaría mantenerte?

Memoria que se actualiza:
- `main_objections += price`
- `maximum_budget` si el cliente responde

Siguiente acción esperada:
- solicitar presupuesto máximo;
- buscar alternativas compatibles.

Handoff:
- no requiere por defecto;
- sí requiere si el cliente insiste en negociar precio o solicita descuento directo.

### 2. Inicial alta

Cliente:

> No tengo tanto para la inicial.

Respuesta modelo:

> Entiendo. Puedo revisar si tenemos proyectos con una separación menor o con el inicial distribuido de una forma más cómoda, siempre según las condiciones confirmadas del proyecto.

Memoria que se actualiza:
- `main_objections += initial_payment`
- `financing_required` o preferencia de plan si surge en la conversación

Siguiente acción esperada:
- buscar planes compatibles;
- solicitar solo un dato adicional si hace falta.

Handoff:
- no requiere por defecto;
- sí requiere si el cliente pide una condición excepcional no confirmada.

### 3. Ubicación lejana

Cliente:

> Eso me queda muy lejos.

Respuesta modelo:

> Claro, podemos buscar algo más cercano. ¿Qué sector o zona te funcionaría mejor?

Memoria que se actualiza:
- `rejected_locations += ubicación actual`
- `preferred_locations` cuando el cliente indique una alternativa

Siguiente acción esperada:
- actualizar zona preferida;
- buscar nuevas opciones.

Handoff:
- no requiere por defecto.

### 4. Propiedad pequeña

Cliente:

> Se ve pequeño.

Respuesta modelo:

> Entiendo. Puedo mostrarte opciones con mayor metraje o una distribución más abierta dentro de un rango similar.

Memoria que se actualiza:
- `main_objections += size`
- `minimum_area_m2` o preferencia de amplitud si el cliente la expresa

Siguiente acción esperada:
- buscar mayor metraje o mejor distribución;
- evitar insistir en la misma propiedad.

Handoff:
- no requiere por defecto.

### 5. Rechazo de propiedad

Cliente:

> Ese no me gustó.

Respuesta modelo:

> No hay problema. Para mostrarte algo más acertado, ¿qué fue lo que menos te gustó: la ubicación, el tamaño, la distribución o el precio?

Memoria que se actualiza:
- `rejected_property_ids += active_property_id`
- motivo de rechazo en `main_objections` o notas de preferencia

Siguiente acción esperada:
- identificar el motivo;
- no volver a recomendar la propiedad rechazada.

Handoff:
- no requiere por defecto.

### 6. Indecisión

Cliente:

> Voy a pensarlo.

Respuesta modelo:

> Claro, sin problema. Si te ayuda, puedo enviarte el brochure o una comparación breve para que lo revises con calma.

Memoria que se actualiza:
- mantener lead abierto;
- registrar que el cliente está evaluando y no desea presión

Siguiente acción esperada:
- ofrecer un recurso útil;
- no presionar;
- dejar la puerta abierta.

Handoff:
- no requiere por defecto.

### 7. Solicitud de descuento

Cliente:

> ¿Me pueden bajar el precio?

Respuesta modelo:

> Puedo dejar registrada tu solicitud para que un asesor confirme si existe alguna condición especial o descuento disponible.

Memoria que se actualiza:
- `handoff_requested = true`
- `handoff_reason = discount_request`
- `main_objections += discount`

Siguiente acción esperada:
- generar handoff;
- registrar contexto de la propiedad e interés.

Handoff:
- sí, obligatorio.

## Límites comerciales

- El asesor no negocia.
- El asesor no promete descuentos.
- El asesor no inventa planes de pago.
- El asesor no ofrece condiciones no confirmadas.
- El asesor deriva a humano cuando la conversación entra en negociación, reserva, descuento o temas delicados.

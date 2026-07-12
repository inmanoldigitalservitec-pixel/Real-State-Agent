# Sales Flow

## Objetivo

Definir el flujo comercial oficial del asesor inmobiliario del MVP para que futuras fases implementen estados, transiciones y criterios de escalamiento sin reinterpretaciones.

## Estados oficiales del MVP

```text
NEW
INQUIRY
DISCOVERY
RECOMMENDATION
PROPERTY_INTEREST
EVALUATION
HIGH_INTENT
VISIT_REQUESTED
HUMAN_HANDOFF
CLOSED
```

## Definición de estados

### `NEW`

El cliente acaba de iniciar una conversación y todavía no existe contexto suficiente sobre lo que busca.

Señales típicas:
- saludo inicial;
- mensaje genérico como "hola" o "información";
- apertura desde una publicación sin pregunta específica.

Objetivo operativo:
- saludar con naturalidad;
- identificar si existe una propiedad específica o una necesidad general;
- obtener la primera pieza de contexto útil.

### `INQUIRY`

El cliente formula una pregunta específica sobre una propiedad, una publicación o una condición comercial.

Señales típicas:
- pregunta por precio;
- pregunta por disponibilidad;
- pregunta por inicial;
- pregunta por ubicación;
- pregunta por una publicación concreta.

Objetivo operativo:
- responder primero la pregunta inmediata;
- luego avanzar de forma natural hacia el siguiente dato útil;
- preparar transición hacia `PROPERTY_INTEREST`, `DISCOVERY` o `HIGH_INTENT`.

### `DISCOVERY`

El agente necesita recopilar información para recomendar opciones adecuadas.

Información prioritaria:
- propiedad de interés;
- zona;
- habitaciones;
- presupuesto.

Información secundaria:
- compra para vivir o invertir;
- financiamiento;
- parqueos;
- amenidades;
- fecha aproximada de compra.

Objetivo operativo:
- completar el contexto mínimo con una sola pregunta principal por turno;
- evitar repetir datos ya conocidos;
- preparar una recomendación relevante.

### `RECOMMENDATION`

El agente ya tiene suficiente contexto para mostrar opciones alineadas con la necesidad del cliente.

Señales típicas:
- ya conoce zona o rango equivalente;
- ya conoce presupuesto o rango equivalente;
- ya conoce habitaciones o tipo de propiedad;
- el cliente pidió opciones concretas.

Objetivo operativo:
- mostrar entre una y tres opciones;
- explicar por qué encajan;
- evitar propiedades irrelevantes o previamente rechazadas;
- incluir una imagen principal cuando exista.

### `PROPERTY_INTEREST`

El cliente muestra interés concreto en una propiedad específica. Esa propiedad pasa a ser la propiedad activa de la conversación.

Señales típicas:
- pide fotos;
- pregunta por precio;
- pregunta por inicial;
- pregunta por disponibilidad;
- pide ubicación;
- solicita el plano;
- pregunta por amenidades.

Objetivo operativo:
- profundizar sobre la propiedad activa;
- responder con información confirmada;
- preparar transición a evaluación o intención alta.

### `EVALUATION`

El cliente está comparando, validando o analizando seriamente una o varias propiedades.

Señales típicas:
- compara propiedades;
- pide plan de pago;
- pregunta cuál le conviene más;
- menciona objeciones;
- revisa brochure, plano o video;
- solicita ventajas o diferencias.

Objetivo operativo:
- ayudar a decidir sin presionar;
- resolver objeciones con datos confirmados;
- entregar assets más profundos cuando corresponda;
- preparar transición a `HIGH_INTENT`, `PROPERTY_INTEREST` o `CLOSED`.

### `HIGH_INTENT`

El cliente se acerca a una acción comercial clara.

Señales típicas:
- quiere visitar;
- quiere separar;
- pregunta qué documentos necesita;
- pregunta cómo iniciar el proceso;
- quiere negociar;
- pide hablar con un asesor.

Objetivo operativo:
- identificar la acción comercial deseada;
- capturar solo los datos mínimos necesarios;
- derivar a una persona cuando aplique.

### `VISIT_REQUESTED`

El cliente solicitó formalmente una visita y el agente debe coordinar la información mínima.

Datos requeridos:
- nombre;
- teléfono;
- propiedad;
- día preferido;
- horario preferido.

Objetivo operativo:
- completar la solicitud de visita sin convertir la conversación en formulario;
- confirmar la propiedad o proyecto asociado;
- preparar handoff humano o cierre controlado.

### `HUMAN_HANDOFF`

La conversación debe pasar a una persona del equipo.

Se activa por:
- solicitud directa del cliente;
- negociación;
- reserva;
- dudas legales;
- dudas financieras delicadas;
- quejas;
- descuento especial;
- visita;
- intención alta.

Objetivo operativo:
- registrar el motivo del handoff;
- resumir el contexto relevante;
- dejar la conversación lista para continuidad humana.

### `CLOSED`

La interacción terminó o quedó en pausa operativa.

Casos típicos:
- lead entregado;
- visita solicitada;
- cliente sin interés;
- conversación abandonada;
- propiedad no compatible.

Objetivo operativo:
- reflejar un cierre claro;
- conservar memoria útil;
- evitar reabrir la conversación sin nuevo motivo.

## Transiciones permitidas

```text
NEW → INQUIRY
NEW → DISCOVERY

INQUIRY → PROPERTY_INTEREST
INQUIRY → DISCOVERY
INQUIRY → HIGH_INTENT

DISCOVERY → RECOMMENDATION
DISCOVERY → HUMAN_HANDOFF

RECOMMENDATION → PROPERTY_INTEREST
RECOMMENDATION → DISCOVERY
RECOMMENDATION → CLOSED

PROPERTY_INTEREST → EVALUATION
PROPERTY_INTEREST → HIGH_INTENT
PROPERTY_INTEREST → DISCOVERY

EVALUATION → PROPERTY_INTEREST
EVALUATION → HIGH_INTENT
EVALUATION → CLOSED

HIGH_INTENT → VISIT_REQUESTED
HIGH_INTENT → HUMAN_HANDOFF

VISIT_REQUESTED → HUMAN_HANDOFF
HUMAN_HANDOFF → CLOSED
```

## Reglas implícitas de transición

- No saltar a `RECOMMENDATION` sin contexto suficiente para que las opciones sean relevantes.
- No entrar en `VISIT_REQUESTED` sin propiedad activa o intención concreta de visitar un proyecto.
- `HUMAN_HANDOFF` se activa por solicitud directa, negociación, visita o temas delicados.
- `PROPERTY_INTEREST` requiere una propiedad activa clara.
- `EVALUATION` no es un estado de saludo ni de búsqueda inicial; requiere al menos una propiedad evaluable.
- `CLOSED` no debe usarse mientras exista una pregunta pendiente importante del cliente.

## Criterios mínimos por estado

| Estado | Debe saber | Debe evitar |
| --- | --- | --- |
| `NEW` | contexto inicial o pregunta principal | pedir demasiados datos |
| `INQUIRY` | pregunta inmediata del cliente | responder con otra pregunta |
| `DISCOVERY` | huecos de información prioritaria | cuestionarios largos |
| `RECOMMENDATION` | criterios suficientes para recomendar | mostrar inventario irrelevante |
| `PROPERTY_INTEREST` | propiedad activa | mezclar varias propiedades sin aclaración |
| `EVALUATION` | objeciones o criterios comparativos | prometer condiciones no confirmadas |
| `HIGH_INTENT` | acción comercial deseada | retrasar handoff necesario |
| `VISIT_REQUESTED` | datos mínimos de visita | pedir todos los datos de golpe |
| `HUMAN_HANDOFF` | motivo y contexto resumido | dejar el caso sin resumen |
| `CLOSED` | resultado del cierre | perder memoria útil |

# Conversation Scenarios

## Objetivo

Definir los escenarios oficiales de prueba de la Fase 1 para validar comportamiento, memoria, assets, transición de estados y necesidad de herramientas futuras.

Nota de estado: algunos escenarios mencionan tools futuras o capacidades disponibles en `agent-core` pero no expuestas aun a Carlos. Para saber que puede invocar Carlos hoy, consulta [Tools y Capacidades](tools-and-capabilities.md).

## Escenarios oficiales

### ID: SC-01
Nombre: Consulta desde una publicación específica

Mensaje inicial:
"Buenas tardes, me interesa el apartamento de Villa Mella que publicaron."

Contexto de origen:
Publicación con `source_property_id` disponible.

Estado inicial:
`NEW`

Intención detectada:
Interés en propiedad específica.

Propiedad activa:
Sin resolver al inicio.

Información disponible:
Existe referencia a Villa Mella y contexto de publicación.

Información faltante:
Disponibilidad actual y siguientes preferencias del cliente.

Tool o tools necesarias:
`resolve_property_reference`, `get_property_details`

Respuesta esperada:
Saludar, confirmar ayuda sobre esa propiedad y ofrecer disponibilidad, precio o fotos.

Pregunta siguiente:
"Si quieres, también puedo confirmarte si sigue disponible o enviarte fotos."

Asset permitido:
`cover_image`

Memoria que se actualiza:
`source_property_id`, `active_property_id`, `last_customer_intent`

Estado final:
`PROPERTY_INTEREST`

Condiciones de handoff:
No aplica por defecto.

Errores que deben evitarse:
No preguntar primero presupuesto. No ignorar el contexto de la publicación.

### ID: SC-02
Nombre: Consulta por disponibilidad

Mensaje inicial:
"¿Todavía está disponible?"

Contexto de origen:
Existe `active_property_id` desde la publicación o turnos previos.

Estado inicial:
`PROPERTY_INTEREST`

Intención detectada:
Verificación de disponibilidad.

Propiedad activa:
Sí.

Información disponible:
Propiedad activa identificada.

Información faltante:
Disponibilidad confirmada.

Tool o tools necesarias:
`check_property_availability`

Respuesta esperada:
Responder si hay disponibilidad confirmada y luego ofrecer siguiente ayuda útil.

Pregunta siguiente:
"Si quieres, también te comparto el precio y algunas fotos."

Asset permitido:
Ninguno por defecto.

Memoria que se actualiza:
`last_customer_intent`, `sales_stage`

Estado final:
`PROPERTY_INTEREST`

Condiciones de handoff:
No aplica por defecto.

Errores que deben evitarse:
No responder de forma vaga. No pedir aclaración si la propiedad activa ya existe.

### ID: SC-03
Nombre: Consulta por precio

Mensaje inicial:
"¿En cuánto está?"

Contexto de origen:
Propiedad activa ya identificada.

Estado inicial:
`PROPERTY_INTEREST`

Intención detectada:
Consulta de precio.

Propiedad activa:
Sí.

Información disponible:
Propiedad activa.

Información faltante:
Precio confirmado.

Tool o tools necesarias:
`get_property_details`

Respuesta esperada:
Indicar precio real confirmado y ofrecer ampliar con fotos o detalles.

Pregunta siguiente:
"Si quieres, también te muestro fotos o las características principales."

Asset permitido:
`cover_image`

Memoria que se actualiza:
`last_customer_intent`

Estado final:
`PROPERTY_INTEREST`

Condiciones de handoff:
No aplica por defecto.

Errores que deben evitarse:
No responder con una pregunta. No inventar precio.

### ID: SC-04
Nombre: Solicitud de fotografías

Mensaje inicial:
"Mándame fotos."

Contexto de origen:
Propiedad activa identificada.

Estado inicial:
`PROPERTY_INTEREST`

Intención detectada:
Solicitud de media.

Propiedad activa:
Sí.

Información disponible:
Propiedad activa.

Información faltante:
Media asociada confirmada.

Tool o tools necesarias:
`get_property_media`

Respuesta esperada:
Enviar una galería corta de la propiedad activa y acompañarla con texto breve.

Pregunta siguiente:
"Si quieres, también puedo compartirte el plano o el precio actualizado."

Asset permitido:
`property_gallery`

Memoria que se actualiza:
`sent_asset_ids`, `viewed_property_ids`

Estado final:
`PROPERTY_INTEREST`

Condiciones de handoff:
No aplica por defecto.

Errores que deben evitarse:
No enviar demasiadas imágenes. No pedir la propiedad si ya está activa.

### ID: SC-05
Nombre: Solicitud de brochure

Mensaje inicial:
"Pásame el brochure."

Contexto de origen:
Propiedad activa identificada.

Estado inicial:
`EVALUATION`

Intención detectada:
Solicitud de documento.

Propiedad activa:
Sí.

Información disponible:
Propiedad activa y contexto de evaluación.

Información faltante:
Documento vigente.

Tool o tools necesarias:
`get_property_documents`

Respuesta esperada:
Compartir el brochure si está vigente o informar que se validará si no está confirmado.

Pregunta siguiente:
"Si quieres, también puedo ayudarte a revisar el plan de pago o coordinar una visita."

Asset permitido:
`brochure`

Memoria que se actualiza:
`sent_brochure_ids`, `last_customer_intent`

Estado final:
`EVALUATION`

Condiciones de handoff:
Si no existe brochure vigente y el cliente lo requiere de inmediato.

Errores que deben evitarse:
No enviar brochure vencido. No enviarlo automáticamente en primera interacción.

### ID: SC-06
Nombre: Búsqueda por cantidad de habitaciones

Mensaje inicial:
"¿Tienen apartamentos de tres habitaciones?"

Contexto de origen:
Sin propiedad específica.

Estado inicial:
`NEW`

Intención detectada:
Búsqueda general.

Propiedad activa:
No.

Información disponible:
Necesidad de tres habitaciones.

Información faltante:
Zona o presupuesto.

Tool o tools necesarias:
Ninguna todavía o `search_properties` cuando haya contexto suficiente.

Respuesta esperada:
Confirmar que puede ayudar y hacer una sola pregunta útil para completar el contexto.

Pregunta siguiente:
"¿En qué zona te gustaría buscar?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`bedrooms`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No mostrar propiedades sin contexto mínimo. No hacer varias preguntas a la vez.

### ID: SC-07
Nombre: Búsqueda por ubicación

Mensaje inicial:
"Busco algo en el Distrito Nacional."

Contexto de origen:
Sin propiedad específica.

Estado inicial:
`NEW`

Intención detectada:
Búsqueda por zona.

Propiedad activa:
No.

Información disponible:
Ubicación preferida.

Información faltante:
Habitaciones o presupuesto.

Tool o tools necesarias:
Ninguna todavía o `search_properties` cuando se complete contexto.

Respuesta esperada:
Confirmar ayuda y pedir el siguiente dato prioritario.

Pregunta siguiente:
"Perfecto. ¿Cuántas habitaciones te gustaría que tenga?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`preferred_locations`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No responder con inventario amplio sin filtro adicional.

### ID: SC-08
Nombre: Búsqueda por presupuesto

Mensaje inicial:
"Mi presupuesto es de hasta ocho millones."

Contexto de origen:
Ya existe conversación abierta de búsqueda.

Estado inicial:
`DISCOVERY`

Intención detectada:
Definición de presupuesto.

Propiedad activa:
No.

Información disponible:
Presupuesto máximo.

Información faltante:
Zona o habitaciones si aún no se conocen.

Tool o tools necesarias:
`search_properties` si el contexto ya es suficiente.

Respuesta esperada:
Reconocer el presupuesto y, si ya hay suficientes datos, recomendar opciones; si no, pedir el dato faltante principal.

Pregunta siguiente:
"¿Prefieres seguir en el Distrito o te gustaría ver también zonas cercanas?"

Asset permitido:
`cover_image` solo si ya se recomiendan opciones.

Memoria que se actualiza:
`maximum_budget`, `pending_question`

Estado final:
`DISCOVERY` o `RECOMMENDATION`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No ignorar el presupuesto al recomendar.

### ID: SC-09
Nombre: Mensaje con errores ortográficos

Mensaje inicial:
"Kiero apto en el distrto d 3 hab."

Contexto de origen:
Sin contexto previo.

Estado inicial:
`NEW`

Intención detectada:
Búsqueda general con errores ortográficos.

Propiedad activa:
No.

Información disponible:
Distrito y tres habitaciones.

Información faltante:
Presupuesto.

Tool o tools necesarias:
Ninguna todavía o `search_properties` cuando haya contexto suficiente.

Respuesta esperada:
Responder de forma natural, sin corregir al cliente de manera explícita.

Pregunta siguiente:
"Claro. ¿Hasta qué presupuesto te gustaría manejarte?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`preferred_locations`, `bedrooms`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No pedir que reformule. No sonar técnico.

### ID: SC-10
Nombre: Mensaje que solo dice información

Mensaje inicial:
"Información."

Contexto de origen:
Sin contexto de publicación.

Estado inicial:
`NEW`

Intención detectada:
Consulta ambigua.

Propiedad activa:
No.

Información disponible:
Ninguna.

Información faltante:
Propiedad específica o criterio de búsqueda.

Tool o tools necesarias:
Ninguna.

Respuesta esperada:
Saludar y pedir una sola aclaración útil.

Pregunta siguiente:
"¿Te interesa alguna propiedad que viste publicada o estás buscando opciones en una zona específica?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`pending_question`

Estado final:
`NEW` o `DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No responder con texto vacío. No pedir demasiados datos.

### ID: SC-11
Nombre: Cambio de ubicación

Mensaje inicial:
"Mejor muéstrame algo por la Kennedy."

Contexto de origen:
Ya hubo una recomendación en otra zona.

Estado inicial:
`RECOMMENDATION`

Intención detectada:
Cambio de preferencia.

Propiedad activa:
No necesariamente.

Información disponible:
Nueva zona preferida.

Información faltante:
Ninguna si ya se conocen presupuesto y habitaciones.

Tool o tools necesarias:
`search_properties`

Respuesta esperada:
Reconocer el cambio y ajustar la búsqueda a la nueva zona.

Pregunta siguiente:
"Perfecto. Voy a enfocarme en opciones cerca de la Kennedy dentro de lo que ya me comentaste."

Asset permitido:
`cover_image`

Memoria que se actualiza:
`preferred_locations`, `rejected_locations`, `recommended_property_ids`

Estado final:
`RECOMMENDATION`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No seguir recomendando la zona anterior como si nada hubiera cambiado.

### ID: SC-12
Nombre: Rechazo de una propiedad

Mensaje inicial:
"Ese no me gustó."

Contexto de origen:
Existe propiedad activa o última propiedad mostrada.

Estado inicial:
`PROPERTY_INTEREST`

Intención detectada:
Rechazo.

Propiedad activa:
Sí.

Información disponible:
Propiedad actual.

Información faltante:
Motivo del rechazo.

Tool o tools necesarias:
Ninguna todavía o `search_properties` después de aclarar.

Respuesta esperada:
Aceptar el rechazo y preguntar una sola causa útil.

Pregunta siguiente:
"¿Qué fue lo que menos te gustó: la ubicación, el tamaño, la distribución o el precio?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`rejected_property_ids`, `main_objections`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No insistir con la misma propiedad.

### ID: SC-13
Nombre: Solicitud de opción más económica

Mensaje inicial:
"¿Tienen algo más barato?"

Contexto de origen:
Ya se mostró una propiedad concreta.

Estado inicial:
`PROPERTY_INTEREST`

Intención detectada:
Objeción de precio y búsqueda alternativa.

Propiedad activa:
Sí.

Información disponible:
Referencia implícita a precio alto.

Información faltante:
Presupuesto máximo si no existe.

Tool o tools necesarias:
`search_properties` o ninguna todavía si falta presupuesto.

Respuesta esperada:
Reconocer la objeción y buscar rango más cómodo o pedir solo el monto máximo.

Pregunta siguiente:
"Claro. ¿Hasta qué monto te gustaría mantenerte?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`main_objections`, `maximum_budget`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica, salvo que el cliente quiera negociación.

Errores que deben evitarse:
No defender el precio antes de ayudar. No inventar descuentos.

### ID: SC-14
Nombre: Consulta por inicial

Mensaje inicial:
"¿Cuánto hay que dar de inicial?"

Contexto de origen:
Propiedad activa identificada.

Estado inicial:
`EVALUATION`

Intención detectada:
Consulta de plan de pago.

Propiedad activa:
Sí.

Información disponible:
Propiedad activa.

Información faltante:
Inicial o plan confirmado.

Tool o tools necesarias:
`get_payment_plan`

Respuesta esperada:
Responder con dato confirmado o indicar que se validará con un asesor.

Pregunta siguiente:
"Si quieres, también puedo revisar contigo cómo quedarían las cuotas si ese plan sigue vigente."

Asset permitido:
`payment_plan`

Memoria que se actualiza:
`sent_payment_plan_ids`, `last_customer_intent`

Estado final:
`EVALUATION`

Condiciones de handoff:
Sí, si el plan no está confirmado o surgen dudas delicadas.

Errores que deben evitarse:
No calcular ni inventar condiciones.

### ID: SC-15
Nombre: Consulta por financiamiento

Mensaje inicial:
"¿Trabajan con financiamiento?"

Contexto de origen:
Conversación general o sobre una propiedad.

Estado inicial:
`INQUIRY`

Intención detectada:
Consulta comercial general.

Propiedad activa:
Opcional.

Información disponible:
Interés en financiamiento.

Información faltante:
Política general o condiciones del proyecto.

Tool o tools necesarias:
`get_company_information`

Respuesta esperada:
Responder con información general confirmada y, si aplica, orientar al siguiente paso.

Pregunta siguiente:
"Si quieres, también te muestro opciones que suelen ajustarse mejor cuando se busca financiamiento."

Asset permitido:
Ninguno.

Memoria que se actualiza:
`financing_required`, `last_customer_intent`

Estado final:
`DISCOVERY` o `PROPERTY_INTEREST`

Condiciones de handoff:
Sí, si la duda entra en detalle financiero delicado no confirmado.

Errores que deben evitarse:
No prometer aprobación ni condiciones bancarias.

### ID: SC-16
Nombre: Comparación entre dos propiedades

Mensaje inicial:
"¿Cuál me conviene más, el de Villa Mella o el del Distrito?"

Contexto de origen:
Dos propiedades ya fueron vistas.

Estado inicial:
`EVALUATION`

Intención detectada:
Comparación.

Propiedad activa:
Hay varias recientes.

Información disponible:
Dos propiedades candidatas.

Información faltante:
Criterio principal del cliente si no está claro.

Tool o tools necesarias:
`compare_properties`

Respuesta esperada:
Comparar con base en datos reales y orientar según el perfil del cliente.

Pregunta siguiente:
"Si quieres, también te puedo decir cuál encaja mejor según si la buscas para vivir o para inversión."

Asset permitido:
Ninguno o `floor_plan` si ayuda y está solicitado.

Memoria que se actualiza:
`recent_property_ids`, `last_customer_intent`

Estado final:
`EVALUATION`

Condiciones de handoff:
No aplica por defecto.

Errores que deben evitarse:
No tratar comparación como estado distinto. No opinar sin datos.

### ID: SC-17
Nombre: Solicitud de visita

Mensaje inicial:
"Quiero ir a verlo."

Contexto de origen:
Propiedad activa identificada.

Estado inicial:
`HIGH_INTENT`

Intención detectada:
Visita.

Propiedad activa:
Sí.

Información disponible:
Interés alto y propiedad activa.

Información faltante:
Nombre, teléfono, día y horario preferidos.

Tool o tools necesarias:
`request_property_visit`, `capture_lead`

Respuesta esperada:
Avanzar con coordinación pidiendo un solo dato útil para comenzar.

Pregunta siguiente:
"Perfecto. ¿A qué nombre te gustaría registrarla?"

Asset permitido:
`reservation_requirements`

Memoria que se actualiza:
`visit_requested`, `preferred_visit_date`, `preferred_visit_time`, `customer_name`

Estado final:
`VISIT_REQUESTED`

Condiciones de handoff:
Sí, después de registrar la solicitud o si el cliente pide hablar con una persona.

Errores que deben evitarse:
No pedir todos los datos en un solo turno.

### ID: SC-18
Nombre: Solicitud de separación

Mensaje inicial:
"Quiero separar ese apartamento."

Contexto de origen:
Propiedad activa identificada.

Estado inicial:
`HIGH_INTENT`

Intención detectada:
Reserva o separación.

Propiedad activa:
Sí.

Información disponible:
Alta intención y propiedad concreta.

Información faltante:
Proceso exacto y requisitos confirmados.

Tool o tools necesarias:
`request_human_handoff`, `get_property_documents`

Respuesta esperada:
Reconocer la intención y derivar a asesor humano para confirmar proceso y condiciones.

Pregunta siguiente:
"Puedo dejarte comunicado con un asesor para confirmar los requisitos y el proceso de separación. ¿A qué nombre y número lo registramos?"

Asset permitido:
`reservation_requirements`

Memoria que se actualiza:
`handoff_requested`, `handoff_reason`, `active_property_id`

Estado final:
`HUMAN_HANDOFF`

Condiciones de handoff:
Obligatorio.

Errores que deben evitarse:
No prometer separación ni aceptar montos.

### ID: SC-19
Nombre: Solicitud de hablar con una persona

Mensaje inicial:
"Pásame con una persona."

Contexto de origen:
Cualquier contexto.

Estado inicial:
`INQUIRY` o `HIGH_INTENT`

Intención detectada:
Handoff directo.

Propiedad activa:
Opcional.

Información disponible:
Solicitud directa.

Información faltante:
Datos mínimos de contacto si todavía no existen.

Tool o tools necesarias:
`request_human_handoff`, `capture_lead`

Respuesta esperada:
Aceptar la solicitud sin fricción y pedir el dato mínimo necesario.

Pregunta siguiente:
"Claro. ¿Cuál es el mejor número para que un asesor te contacte?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`handoff_requested`, `handoff_reason`, `phone`

Estado final:
`HUMAN_HANDOFF`

Condiciones de handoff:
Obligatorio.

Errores que deben evitarse:
No intentar retener al cliente artificialmente.

### ID: SC-20
Nombre: Referencia ambigua

Mensaje inicial:
"¿Y el otro que me enseñaste?"

Contexto de origen:
Existen varias propiedades recientes.

Estado inicial:
`EVALUATION`

Intención detectada:
Referencia ambigua a propiedad previa.

Propiedad activa:
Ambigua.

Información disponible:
`recent_property_ids`

Información faltante:
Cuál de las propiedades recientes quiere retomar.

Tool o tools necesarias:
Ninguna o `get_property_details` después de aclarar.

Respuesta esperada:
Usar memoria reciente para desambiguar con una pregunta corta si hace falta.

Pregunta siguiente:
"¿Te refieres al de Villa Mella o al del Distrito?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`pending_question`, `recent_property_ids`

Estado final:
`EVALUATION` o `PROPERTY_INTEREST`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No fingir entender una referencia que sigue ambigua.

### ID: SC-21
Nombre: Propiedad no disponible

Mensaje inicial:
"Me interesa ese, ¿todavía está disponible?"

Contexto de origen:
Propiedad específica identificada.

Estado inicial:
`PROPERTY_INTEREST`

Intención detectada:
Consulta de disponibilidad.

Propiedad activa:
Sí.

Información disponible:
Propiedad activa.

Información faltante:
Disponibilidad confirmada.

Tool o tools necesarias:
`check_property_availability`, `search_properties`

Respuesta esperada:
Informar que no está disponible si ese es el caso y ofrecer alternativas cercanas o similares.

Pregunta siguiente:
"Si quieres, puedo mostrarte opciones parecidas en esa misma zona."

Asset permitido:
Ninguno o `cover_image` de alternativa solo después de aceptarla.

Memoria que se actualiza:
`active_property_id`, `last_customer_intent`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No ocultar indisponibilidad. No insistir en esa misma propiedad.

### ID: SC-22
Nombre: Propiedad fuera de presupuesto

Mensaje inicial:
"Ese se me sale del presupuesto."

Contexto de origen:
Propiedad activa ya presentada.

Estado inicial:
`PROPERTY_INTEREST`

Intención detectada:
Objeción de presupuesto.

Propiedad activa:
Sí.

Información disponible:
La propiedad actual es demasiado costosa.

Información faltante:
Presupuesto objetivo si no existe.

Tool o tools necesarias:
`search_properties` o ninguna hasta definir monto.

Respuesta esperada:
Reconocer objeción y reorientar la búsqueda.

Pregunta siguiente:
"Entiendo. ¿Hasta qué monto te gustaría mantenerte para mostrarte opciones más acertadas?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`main_objections`, `maximum_budget`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No presionar ni defender el precio.

### ID: SC-23
Nombre: Cliente indeciso

Mensaje inicial:
"Voy a pensarlo."

Contexto de origen:
Ya hubo evaluación de una propiedad.

Estado inicial:
`EVALUATION`

Intención detectada:
Indecisión.

Propiedad activa:
Sí u opción principal reciente.

Información disponible:
Cliente necesita tiempo.

Información faltante:
Si desea material adicional.

Tool o tools necesarias:
`get_property_documents` opcional si acepta brochure.

Respuesta esperada:
No presionar y ofrecer un recurso útil.

Pregunta siguiente:
"Si te ayuda, puedo enviarte el brochure o una comparación breve para que lo revises con calma."

Asset permitido:
`brochure`

Memoria que se actualiza:
`lead_temperature`, `last_customer_intent`

Estado final:
`EVALUATION`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No cerrar la conversación de forma brusca. No presionar por decisión.

### ID: SC-24
Nombre: Cliente que deja de responder y vuelve

Mensaje inicial:
"Hola, vuelvo por lo que vimos ayer."

Contexto de origen:
Existe historial y resumen.

Estado inicial:
`NEW` desde la reanudación operativa

Intención detectada:
Reanudación de conversación.

Propiedad activa:
Puede existir una propiedad reciente.

Información disponible:
`conversation_summary`, `recent_property_ids`

Información faltante:
Qué punto desea retomar.

Tool o tools necesarias:
Ninguna al inicio.

Respuesta esperada:
Retomar con contexto sin hacer empezar de cero.

Pregunta siguiente:
"Claro. Ayer estuvimos viendo opciones de tres habitaciones. ¿Quieres que retomemos la última que te interesó o prefieres ver otra alternativa?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`conversation_summary`, `last_customer_intent`

Estado final:
`DISCOVERY`, `PROPERTY_INTEREST` o `EVALUATION`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No actuar como si fuera una conversación nueva sin contexto.

### ID: SC-25
Nombre: Cliente que pregunta algo no registrado

Mensaje inicial:
"¿Cuándo entregan la tercera torre?"

Contexto de origen:
Dato podría no estar disponible.

Estado inicial:
`INQUIRY`

Intención detectada:
Consulta de dato sensible.

Propiedad activa:
Opcional.

Información disponible:
Pregunta específica.

Información faltante:
Fecha de entrega confirmada.

Tool o tools necesarias:
`get_property_details`

Respuesta esperada:
Responder solo si hay dato confirmado; si no, indicar que se validará con asesor.

Pregunta siguiente:
"Si quieres, también puedo dejarte registrada esa consulta para confirmártela con exactitud."

Asset permitido:
Ninguno.

Memoria que se actualiza:
`last_customer_intent`, `pending_question`

Estado final:
`INQUIRY` o `HUMAN_HANDOFF`

Condiciones de handoff:
Sí, si el dato no está confirmado y el cliente necesita precisión.

Errores que deben evitarse:
No inventar fechas.

### ID: SC-26
Nombre: Cliente que pide descuento

Mensaje inicial:
"¿Me pueden bajar el precio?"

Contexto de origen:
Propiedad activa identificada.

Estado inicial:
`HIGH_INTENT`

Intención detectada:
Negociación.

Propiedad activa:
Sí.

Información disponible:
Interés alto y solicitud de descuento.

Información faltante:
Validación humana.

Tool o tools necesarias:
`request_human_handoff`

Respuesta esperada:
Registrar solicitud y pasar a humano.

Pregunta siguiente:
"Puedo dejar tu solicitud registrada para que un asesor confirme si existe alguna condición especial. ¿Cuál es el mejor número para contactarte?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`handoff_requested`, `handoff_reason`, `main_objections`

Estado final:
`HUMAN_HANDOFF`

Condiciones de handoff:
Obligatorio.

Errores que deben evitarse:
No negociar. No prometer rebaja.

### ID: SC-27
Nombre: Cliente que busca para vivir

Mensaje inicial:
"Lo quiero para vivir con mi familia."

Contexto de origen:
Ya existe conversación de búsqueda.

Estado inicial:
`DISCOVERY`

Intención detectada:
Definición de propósito de compra.

Propiedad activa:
No.

Información disponible:
Propósito habitacional.

Información faltante:
Zona, habitaciones o presupuesto si aún no se conocen.

Tool o tools necesarias:
`search_properties` si el contexto ya está completo.

Respuesta esperada:
Reconocer el propósito y usarlo para orientar opciones más familiares.

Pregunta siguiente:
"Perfecto. Para vivir en familia, ¿qué zona te gustaría priorizar?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`purchase_purpose`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No tratarlo igual que una búsqueda de inversión si ya aclaró el propósito.

### ID: SC-28
Nombre: Cliente que busca para inversión

Mensaje inicial:
"Estoy buscando algo para inversión."

Contexto de origen:
Conversación abierta sin propósito definido.

Estado inicial:
`DISCOVERY`

Intención detectada:
Definición de propósito de compra.

Propiedad activa:
No.

Información disponible:
Propósito de inversión.

Información faltante:
Zona, presupuesto o tipo de retorno esperado.

Tool o tools necesarias:
`search_properties` si hay suficiente contexto.

Respuesta esperada:
Reconocer el enfoque de inversión y continuar con una pregunta útil.

Pregunta siguiente:
"Perfecto. ¿Tienes alguna zona en mente o prefieres que empecemos por opciones con mejor proyección dentro de tu presupuesto?"

Asset permitido:
Ninguno.

Memoria que se actualiza:
`purchase_purpose`, `pending_question`

Estado final:
`DISCOVERY`

Condiciones de handoff:
Solo si pide proyecciones financieras no confirmadas.

Errores que deben evitarse:
No inventar rentabilidad.

### ID: SC-29
Nombre: Cliente que cambia de opinión

Mensaje inicial:
"Pensándolo mejor, prefiero algo de dos habitaciones."

Contexto de origen:
Ya existía búsqueda de tres habitaciones.

Estado inicial:
`DISCOVERY` o `RECOMMENDATION`

Intención detectada:
Cambio de criterio.

Propiedad activa:
No necesariamente.

Información disponible:
Nuevo criterio de habitaciones.

Información faltante:
Ninguna si lo demás sigue vigente.

Tool o tools necesarias:
`search_properties`

Respuesta esperada:
Aceptar el cambio y ajustar la búsqueda.

Pregunta siguiente:
"Perfecto, actualizo la búsqueda a dos habitaciones manteniendo el rango y la zona que ya me comentaste."

Asset permitido:
`cover_image` si se muestran nuevas recomendaciones.

Memoria que se actualiza:
`bedrooms`, `recommended_property_ids`

Estado final:
`RECOMMENDATION` o `DISCOVERY`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No seguir mostrando opciones con el criterio antiguo.

### ID: SC-30
Nombre: Cliente que solicita varias opciones

Mensaje inicial:
"Muéstrame varias opciones."

Contexto de origen:
Ya existe contexto mínimo de búsqueda.

Estado inicial:
`DISCOVERY`

Intención detectada:
Solicitud de recomendación.

Propiedad activa:
No.

Información disponible:
Zona, presupuesto y habitaciones ya definidos.

Información faltante:
Ninguna crítica.

Tool o tools necesarias:
`search_properties`

Respuesta esperada:
Mostrar entre una y tres opciones relevantes y explicar por qué encajan.

Pregunta siguiente:
"Si quieres, después vemos con más detalle la que más te llame la atención."

Asset permitido:
`cover_image`

Memoria que se actualiza:
`recommended_property_ids`, `recent_property_ids`

Estado final:
`RECOMMENDATION`

Condiciones de handoff:
No aplica.

Errores que deben evitarse:
No mostrar demasiadas opciones. No incluir propiedades rechazadas o fuera de criterio.

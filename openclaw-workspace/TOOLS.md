# TOOLS.md

## Estado de esta fase

En Fase 4B.1 el agente `real-estate-agent` tiene exactamente estas tools:

- `agent_core_health`: verifica que `agent-core` este disponible.
- `search_properties`: busca opciones reales de inventario via `POST /internal/properties/search`.
- `get_property_assets`: obtiene hasta 3 enlaces JPG, PNG o PDF asociados a una propiedad.

## Reglas internas

- No simular consultas de inventario.
- No inventar resultados de busqueda.
- Usar `search_properties` cuando el cliente pida opciones de inmuebles.
- Usar memoria conversacional para completar filtros conocidos.
- Preguntar una sola aclaracion cuando falten datos importantes para buscar.
- Mostrar hasta 3 opciones por defecto. Cuando el usuario pida todas, todo el inventario o una lista completa, solicitar y presentar hasta 10.
- No revelar UUIDs, companyId, conversationId, sessionKey, tokens, endpoints ni detalles tecnicos.
- No afirmar que se verifico disponibilidad.
- Tratar `availableUnits` solo como conteo general de unidades, no como confirmacion de una unidad especifica.
- No afirmar que se adjuntaron o enviaron archivos.
- Usar `get_property_assets` después de identificar una propiedad concreta cuando un recurso visual o PDF pueda ayudar a avanzar la venta.
- Al presentar hasta 3 propiedades, llamar `get_property_assets` una vez por propiedad y solicitar preferiblemente una imagen representativa con `limit: 1`.
- Si una búsqueda devuelve más de 3 resultados, consultar recursos solo para las 3 propiedades destacadas o para la recomendada.
- Compartir solamente enlaces devueltos por la tool.
- Mostrar entre 1 y 3 enlaces relevantes por turno.
- Cuando el cliente solicite imágenes y documentos en el mismo mensaje, hacer llamadas separadas por tipo: hasta 2 imágenes en una llamada y el documento solicitado en otra con su categoría exacta y `limit: 1`.
- No afirmar que un brochure, plano, plan de pago u otro documento no existe sin ejecutar primero una consulta dedicada a esa categoría.
- No revelar el `propertyId` usado internamente.
- Si no existen recursos, continuar la conversación sin inventarlos ni mencionar errores técnicos.
- No usar tools genericas para sustituir funciones inmobiliarias del proyecto.
- Mantener la conversacion natural sin explicar estas limitaciones salvo que el usuario pregunte.

## Reglas geograficas

- `Santo Domingo` sin calificadores representa una busqueda amplia en el Gran Santo Domingo.
- Cuando el cliente diga solamente `Santo Domingo`, usar `location: "Santo Domingo"`, nunca `city: "Santo Domingo"`.
- La busqueda amplia de `Santo Domingo` puede incluir Distrito Nacional, Santo Domingo Este, Santo Domingo Norte y Santo Domingo Oeste cuando exista inventario.
- Usar `city` solo cuando el cliente solicite una division geografica exacta, por ejemplo `Santo Domingo Este`, `Santo Domingo Norte`, `Santo Domingo Oeste` o `Distrito Nacional`.
- Si el cliente dice `solo Distrito Nacional` o pide excluir Este, Norte u Oeste, usar el filtro exacto correspondiente.
- Para sectores y zonas como Villa Mella, Kennedy y Ensanche Ozama, usar `location`.

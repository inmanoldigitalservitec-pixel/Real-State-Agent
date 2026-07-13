# Escenarios Funcionales

Usa estos escenarios para validar comportamiento de Carlos de punta a punta.

## 1. Saludo Inicial

Cliente:

```text
Hola, me interesa un apartamento.
```

Esperado:

- Carlos se presenta brevemente;
- pregunta solo la zona;
- no pregunta presupuesto;
- no busca propiedades todavia.

## 2. Busqueda Por Zona

Cliente:

```text
En Santo Domingo Este.
```

Esperado:

- Carlos usa `search_properties`;
- presenta hasta 3 opciones;
- usa `get_property_assets` una vez por propiedad presentada;
- comparte una imagen representativa por propiedad si existe;
- recomienda una opcion;
- cierra con una sola pregunta.

## 3. Gran Santo Domingo

Cliente:

```text
Busco apartamentos de 3 habitaciones en Santo Domingo.
```

Esperado:

- usa `location: "Santo Domingo"`;
- no usa `city: "Santo Domingo"` para la busqueda amplia;
- puede incluir Santo Domingo, Distrito Nacional, Santo Domingo Este, Norte y Oeste si hay inventario.

## 4. City Estricta

Cliente:

```text
Quiero solo propiedades en Santo Domingo Este.
```

Esperado:

- respeta el filtro especifico;
- no expande a Santo Domingo Norte ni Distrito Nacional.

## 5. Todas Las Propiedades

Cliente:

```text
Muestrame todas las propiedades disponibles, sin agrupar por ciudad ni proyecto. Incluye apartamentos de 2 y 3 habitaciones.
```

Esperado:

- Carlos solicita hasta 10 resultados;
- no recorta artificialmente a 3;
- destaca las 3 mejores para orientar;
- no consulta recursos de todas si hay mas de 3.

## 6. Recursos De Una Propiedad

Cliente:

```text
Me interesa la primera. Comparteme fotos y brochure si tienes.
```

Esperado:

- Carlos usa `get_property_assets` para la propiedad seleccionada;
- comparte entre 1 y 3 enlaces relevantes;
- si pide fotos y documentos juntos, puede hacer consultas separadas;
- no inventa recursos si no existen.

## 7. Alta Intencion

Cliente:

```text
Quiero verla esta semana.
```

Esperado:

- Carlos no sigue explorando innecesariamente;
- avanza hacia visita o contacto humano usando las herramientas autorizadas cuando existan para Carlos;
- no afirma que la visita quedo coordinada si la accion no se ejecuto realmente.


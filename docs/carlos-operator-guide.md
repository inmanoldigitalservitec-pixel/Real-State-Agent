# Guia de Operacion de Carlos

Carlos es el asesor comercial del agente `real-estate-agent` dentro de OpenClaw.

## Como Abrirlo

Recomendado para pruebas limpias:

```bash
carlos
```

La funcion local esperada:

```bash
carlos() {
  cd "/Users/inma/Documents/Real State Agent" || return 1
  set -a
  source .env.local
  set +a
  openclaw tui --session "agent:real-estate-agent:carlos-$(date +%Y%m%d%H%M%S)"
}
```

Sesion fija, solo si necesitas continuidad exacta:

```bash
carlos-fijo
```

Esa sesion suele apuntar a:

```text
agent:real-estate-agent:carlos
```

## Antes de Probar

1. Levanta `agent-core`:

```bash
pnpm dev:core
```

2. Valida gateway:

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
./scripts/start-gateway.sh
```

3. Abre Carlos:

```bash
carlos
```

## Flujo Comercial Esperado

Si el cliente dice:

```text
Hola, me interesa un apartamento.
```

Carlos debe presentarse y preguntar solo la zona. No debe preguntar presupuesto en el primer turno.

Cuando el cliente da una zona, Carlos debe:

1. llamar `search_properties`;
2. presentar hasta 3 opciones por defecto;
3. llamar `get_property_assets` una vez por cada propiedad presentada cuando muestre o recomiende propiedades;
4. compartir preferiblemente una imagen representativa por propiedad;
5. explicar ubicacion, habitaciones, precio disponible, amenidades y beneficio principal;
6. recomendar una opcion con criterio;
7. cerrar con una sola pregunta principal, por ejemplo si la compra es para vivir o invertir.

Cuando el cliente pide todas las opciones, Carlos puede solicitar hasta 10 resultados y destacar las 3 mas relevantes.

## Tools Disponibles Para Carlos

- `agent_core_health`: verifica disponibilidad de `agent-core`.
- `search_properties`: busca inventario real.
- `get_property_assets`: obtiene hasta 3 enlaces JPG, PNG o PDF asociados a una propiedad.

## Lo Que Carlos No Debe Hacer

- inventar propiedades, precios, disponibilidad o amenidades;
- revelar UUIDs, `propertyId`, endpoints, tokens o detalles tecnicos;
- consultar Supabase directamente;
- afirmar que adjunto, envio o reservo algo si no se ejecuto una accion real;
- saturar con todos los recursos de una propiedad;
- preguntar muchas cosas en un solo turno;
- pedir presupuesto antes de tener una zona cuando el cliente solo expresa interes general.

## Pruebas Manuales Utiles

Busqueda concreta:

```text
Usa search_properties con location Santo Domingo, bedrooms 3 y propertyType apartment. Presenta las propiedades encontradas.
```

Solicitud amplia:

```text
Muestrame todas las propiedades disponibles, sin agrupar por ciudad ni proyecto. Incluye apartamentos de 2 y 3 habitaciones.
```

Recursos:

```text
Me interesa la primera opcion. Comparteme una imagen, el plano o brochure si estan disponibles.
```


# Base de Datos y Seed

Supabase es la fuente de verdad del proyecto.

## Carpeta

```text
supabase
```

Consulta tambien:

```text
supabase/README.md
```

## Datos Que Viven En Supabase

- companias;
- desarrollos;
- propiedades;
- unidades/listings;
- medios y documentos;
- conversaciones;
- mensajes;
- leads;
- visitas;
- handoffs;
- eventos.

## Regla De Acceso

OpenClaw no consulta Supabase directamente.

El flujo correcto es:

```text
OpenClaw tool -> agent-core /internal/* -> servicios/repositorios -> Supabase
```

## Seed De Demo

El seed de demo debe conservarse como fuente de pruebas funcionales. No modifiques datos para arreglar comportamiento de Carlos; primero identifica si el problema esta en:

- normalizacion de argumentos;
- tool de OpenClaw;
- contrato HTTP;
- servicio de `agent-core`;
- repositorio;
- seed o dato real.

## Smokes Relacionados

```bash
pnpm --filter @real-estate-agent/agent-core smoke:supabase
pnpm --filter @real-estate-agent/agent-core smoke:internal-api
```

Los tests de integracion pueden saltarse si faltan variables Supabase; revisa la salida antes de asumir fallo de codigo.


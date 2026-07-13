# Documentacion

Esta carpeta mezcla documentacion operativa actual con investigaciones historicas. Para orientarte rapido, usa primero los documentos de esta pagina.

## Documentos Vigentes

- [Getting Started](getting-started.md): arranque local de `agent-core`, OpenClaw y Carlos.
- [Arquitectura](architecture.md): fronteras entre OpenClaw, plugin, `agent-core` y Supabase.
- [Guia de Operacion de Carlos](carlos-operator-guide.md): como usar y probar el agente comercial.
- [Comandos](commands.md): comandos frecuentes del monorepo, plugin y OpenClaw.
- [Tools y Capacidades](tools-and-capabilities.md): diferencia entre tools visibles para Carlos y capacidades existentes en `agent-core`.
- [Variables de Entorno](environment.md): variables locales y relacion entre claves.
- [Base de Datos y Seed](database-and-seed.md): rol de Supabase y reglas de acceso.
- [Testing](testing.md): comandos de build, typecheck, tests y smokes.
- [Troubleshooting](troubleshooting.md): problemas comunes y ruta de diagnostico.
- [Escenarios Funcionales](functional-test-scenarios.md): pruebas conversacionales recomendadas.

## Documentos De Producto Y Comportamiento

- [Conversation Guide](conversation-guide.md)
- [Conversation Scenarios](conversation-scenarios.md)
- [Sales Flow](sales-flow.md)
- [Memory Map](memory-map.md)
- [Tool Map](tool-map.md)
- [Objection Handling](objection-handling.md)
- [Asset Strategy](asset-strategy.md)

## Snapshots Historicos

Los directorios `docs/research/` y `docs/implementation/phase-*` conservan hallazgos y decisiones de fases anteriores. Pueden contener frases como "placeholder", "sin tools inmobiliarias" o referencias a Fase 4A que fueron correctas en su momento, pero no describen necesariamente el estado actual.

Cuando haya conflicto, prioriza:

1. `README.md` en la raiz.
2. Esta pagina.
3. Los documentos vigentes listados arriba.
4. El codigo actual.
5. Los snapshots historicos solo como contexto.


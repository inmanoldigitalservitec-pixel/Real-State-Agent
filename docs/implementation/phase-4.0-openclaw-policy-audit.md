# Fase 4.0 OpenClaw Policy Audit

## Estado actual

- Version: `OpenClaw 2026.6.8`
- Agente auditado: `real-estate-agent`
- Workspace: `/Users/inma/Documents/Real State Agent/openclaw-workspace`
- Gateway: configurado en modo local, bind `loopback`, puerto `18789`
- Modelo del agente: `openai/gpt-5.5`
- Plugins descubiertos: se detectaron plugins stock y globales; entre los relevantes para esta fase aparecen `openai`, `codex`, `parallel`, `openclaw-macos-control-center` y `openclaw-test-tool-plugin`
- Plugins cargados globalmente en config: `openai`, `codex`, `parallel`
- Skills efectivas del agente: el CLI reporto `20/58 ready`, incluyendo `browser-automation`, `canvas`, `github`, `healthcheck`, `notion`, `session-logs`, `skill-creator`, `spike`, `taskflow`, `weather` y otras
- Tool profile global: `coding`
- Allowlist global de plugins: `NO CONFIGURADA`
- Denylist global de plugins: `NO CONFIGURADA`
- Allowlist global de tools: `NO CONFIGURADA`
- Denylist global de tools: `NO CONFIGURADA`
- Approvals locales: archivo presente, `Allowlist = 0`, `Agents = 0`
- Sandbox efectivo de `real-estate-agent`: `mode = off`, `scope = agent`, con allow por defecto para `exec`, `process`, `read`, `write`, `edit`, `apply_patch`, `image`, `sessions_*`, `subagents`

## Evidencia clave

- `CONFIRMADO`: `openclaw.json` contiene el agente `real-estate-agent` con workspace del repo y modelo `openai/gpt-5.5`.
- `CONFIRMADO`: `tools.profile = coding` se define globalmente.
- `CONFIRMADO`: `plugins.entries` habilita `openai`, `codex` y `parallel`.
- `CONFIRMADO`: `openclaw-macos-control-center` esta instalado globalmente y expone tools de control de macOS.
- `CONFIRMADO`: `openclaw-test-tool-plugin` esta instalado globalmente y expone `test_echo_tool`.
- `CONFIRMADO`: `openclaw sandbox explain --agent real-estate-agent` muestra una superficie efectiva amplia de tools locales.
- `CONFIRMADO`: el schema de config soporta `plugins.allow`, `plugins.deny`, `tools.allow`, `tools.alsoAllow`, `tools.deny`, `agents.defaults.skills` y `agents.list[].skills`.
- `CONFIRMADO`: el schema de sandbox muestra rutas de override por agente para tools sandboxeadas.

## Riesgos

### ALTO

- Perfil global `coding` habilita una base demasiado amplia para un asesor inmobiliario.
- El sandbox efectivo del agente permite `exec`, `process`, `read`, `write`, `edit` y `apply_patch`.
- `codex` esta habilitado globalmente y puede arrastrar tooling de programacion que no corresponde a esta fase.
- No existe allowlist actual de plugins ni de approvals por agente.

### MEDIO

- `openclaw-macos-control-center` esta disponible globalmente y aporta control del sistema local.
- `openclaw-test-tool-plugin` introduce una tool de prueba que no pertenece al dominio.
- Hay skills efectivas no relacionadas con el caso inmobiliario, incluyendo browser y capacidades auxiliares.
- La configuracion global es compartida con el agente `main`.

### BAJO

- `parallel` esta habilitado globalmente, pero su riesgo inmediato depende de tool exposure efectiva.
- El workspace ya esta separado por agente y las sesiones del agente inmobiliario viven fuera de `main`.

## Politica minima propuesta

Objetivo: dejar a `real-estate-agent` sin acceso operativo a shell, exec, filesystem arbitrario, browser, control de macOS, tools de prueba, tooling de programacion ni plugins de otros proyectos durante Fase 4.0.

### Propuesta 1

- Archivo o seccion: `~/.openclaw/openclaw.json` -> `agents.list[]` del agente `real-estate-agent`
- Configuracion actual saneada:
  - `model: openai/gpt-5.5`
  - sin `skills` explicitas
  - hereda `tools.profile = coding`
  - sin politica local propia de plugins ni tools
- Configuracion propuesta:
  - agregar `skills: []` al agente `real-estate-agent`
- Alcance: por agente
- Impacto en `main`: ninguno directo
- Impacto en `real-estate-agent`: elimina skills cargadas por herencia
- Riesgo: `MEDIO`
- Rollback: quitar `skills: []`
- Aplicacion automatica: `PENDIENTE DE APROBACION MANUAL`
- Motivo: aunque el schema confirma `agents.list[].skills`, no se valido aqui un set agent-scoped completo sin abrir una nueva sesion TUI

### Propuesta 2

- Archivo o seccion: `~/.openclaw/openclaw.json` -> politica de tools por agente para `real-estate-agent`
- Configuracion actual saneada:
  - hereda `tools.profile = coding`
  - el sandbox efectivo permite `exec`, `process`, `read`, `write`, `edit`, `apply_patch` y mas
- Configuracion propuesta:
  - agregar una politica por agente que use perfil minimo y deny explicito para `exec`, `process`, `read`, `write`, `edit`, `apply_patch`, `browser`, `canvas`, `nodes`, `subagents`, `sessions_send`, `sessions_spawn`
- Alcance: por agente
- Impacto en `main`: ninguno si se aplica solo al bloque del agente
- Impacto en `real-estate-agent`: reduce la superficie a conversacion basica sin tools de dominio
- Riesgo: `ALTO`
- Rollback: remover el bloque de tools del agente
- Aplicacion automatica: `PENDIENTE DE APROBACION MANUAL`
- Motivo: el schema confirma capacidad de restriccion por agente, pero la sintaxis exacta del bloque final a escribir no se valido end-to-end en esta corrida sin cambiar configuracion real

### Propuesta 3

- Archivo o seccion: `~/.openclaw/openclaw.json` -> `plugins.allow` o `plugins.deny`
- Configuracion actual saneada:
  - `plugins.entries`: `openai`, `codex`, `parallel`
  - plugins globales descubiertos incluyen `openclaw-macos-control-center` y `openclaw-test-tool-plugin`
- Configuracion propuesta:
  - definir allowlist o denylist especifica para que `real-estate-agent` no exponga `codex`, `openclaw-macos-control-center` ni `openclaw-test-tool-plugin`
- Alcance: probablemente global salvo que se confirme otro nivel de scope
- Impacto en `main`: potencialmente alto
- Impacto en `real-estate-agent`: reduce plugins no deseados
- Riesgo: `ALTO`
- Rollback: restaurar `plugins.allow` o `plugins.deny` anterior
- Aplicacion automatica: `PENDIENTE DE APROBACION MANUAL`
- Motivo: el schema confirma `plugins.allow` y `plugins.deny` globales, pero aqui no quedo confirmado con evidencia suficiente un scope limpio por agente para plugins generales

## Cambios aplicados

- Ningun cambio global de plugins o tools fue aplicado.
- Ninguna configuracion de `main` fue modificada.
- La politica queda documentada para revision y aprobacion humana.

## Cambios pendientes de aprobacion

- skill allowlist vacia para `real-estate-agent`
- politica de tools minima por agente
- cualquier restriccion de plugins que pueda afectar carga global o compartida

## Recomendacion de aprobacion

1. Aprobar primero restricciones por agente para `skills` y `tools`.
2. Validar TUI del agente inmobiliario en una sesion nueva.
3. Solo despues evaluar si hace falta tocar `plugins.allow` o `plugins.deny` globales.

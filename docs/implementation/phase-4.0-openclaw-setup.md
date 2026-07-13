# Fase 4.0 OpenClaw Setup

## 1. Objetivo

Dejar listo el workspace operativo de `real-estate-agent` para validacion manual de identidad y comportamiento, sin crear todavia tools inmobiliarias ni tocar backend.

## 2. Estado inicial

- `COMPLETADO`: OpenClaw instalado
- `COMPLETADO`: agente `real-estate-agent` existente
- `COMPLETADO`: workspace asociado al repo
- `COMPLETADO`: gateway configurado en loopback puerto `18789`
- `COMPLETADO`: modelo del agente definido como `openai/gpt-5.5`
- `NO BLOQUEANTE`: el workspace generado seguia en modo bootstrap y con identidad generica
- `NO BLOQUEANTE`: la politica efectiva de plugins/tools es demasiado amplia para un asesor inmobiliario

## 3. Pasos manuales ya completados

- `COMPLETADO`: instalacion base de OpenClaw
- `COMPLETADO`: creacion del agente
- `COMPLETADO`: asociacion del workspace
- `COMPLETADO`: autenticacion OAuth segun contexto entregado
- `COMPLETADO`: gateway activo segun contexto entregado

## 4. Agente creado

- `COMPLETADO`: `real-estate-agent`

## 5. Workspace

- `COMPLETADO`: `/Users/inma/Documents/Real State Agent/openclaw-workspace`

## 6. Sesiones

- `COMPLETADO`: existe carpeta dedicada en `~/.openclaw/agents/real-estate-agent/sessions`

## 7. Modelo

- `COMPLETADO`: `openai/gpt-5.5` configurado para `real-estate-agent`

## 8. OAuth

- `NO BLOQUEANTE`: no se documentan credenciales ni tokens; la validacion funcional final queda fuera de este documento
- `NO BLOQUEANTE`: `openclaw models status` sin contexto de agente sigue mostrando el default/global de `main`, por lo que no se tomo como fuente unica para validar el modelo de Carlos

## 9. Gateway

- `COMPLETADO`: configurado en modo local

## 10. Bind y puerto

- `COMPLETADO`: `loopback`
- `COMPLETADO`: `18789`

## 11. Health

- `COMPLETADO`: `./scripts/check-openclaw.sh` valido `openclaw health`

## 12. Archivos de identidad

- `COMPLETADO`: `IDENTITY.md`
- `COMPLETADO`: `SOUL.md`
- `COMPLETADO`: `USER.md`
- `COMPLETADO`: `AGENTS.md`
- `COMPLETADO`: `TOOLS.md`
- `COMPLETADO`: `HEARTBEAT.md`

## 13. Eliminacion de bootstrap

- `COMPLETADO`: `BOOTSTRAP.md` queda retirado del workspace despues del backup

## 14. `.git` anidado

- `COMPLETADO`: no se detecto `.git` interno en `openclaw-workspace`

## 15. Plugins detectados

- `COMPLETADO`: `openai`
- `COMPLETADO`: `codex`
- `COMPLETADO`: `parallel`
- `COMPLETADO`: `openclaw-macos-control-center`
- `COMPLETADO`: `openclaw-test-tool-plugin`

## 16. Tools detectadas

- `COMPLETADO`: herramientas de sandbox local como `exec`, `process`, `read`, `write`, `edit`, `apply_patch`
- `COMPLETADO`: tools de control macOS del plugin global
- `COMPLETADO`: `test_echo_tool` del plugin de prueba

## 17. Politica actual

- `NO BLOQUEANTE`: hereda `tools.profile = coding`
- `NO BLOQUEANTE`: no hay allowlist ni denylist activas para plugins o approvals locales
- `NO BLOQUEANTE`: el sandbox efectivo del agente sigue siendo demasiado amplio para el dominio

## 18. Politica propuesta

- `PENDIENTE DE APROBACION`: vaciar `skills` del agente
- `PENDIENTE DE APROBACION`: definir politica minima de tools por agente
- `PENDIENTE DE APROBACION`: evaluar bloqueo de plugins no deseados sin afectar `main`

## 19. Cambios aplicados

- `COMPLETADO`: identidad de Carlos definida
- `COMPLETADO`: instrucciones comerciales basicas del workspace
- `COMPLETADO`: `HEARTBEAT.md` dejado en estado seguro
- `COMPLETADO`: scripts `check-openclaw.sh`, `start-gateway.sh`, `stop-gateway.sh`
- `COMPLETADO`: README del workspace actualizado
- `COMPLETADO`: auditoria y documentacion de Fase 4.0 creadas

## 20. Cambios pendientes de aprobacion

- `PENDIENTE DE APROBACION`: politica de plugins y tools

## 21. Scripts creados

- `openclaw-workspace/scripts/check-openclaw.sh`
- `openclaw-workspace/scripts/start-gateway.sh`
- `openclaw-workspace/scripts/stop-gateway.sh`

## 22. Comandos de operacion

```bash
cd "/Users/inma/Documents/Real State Agent/openclaw-workspace"
./scripts/check-openclaw.sh
./scripts/start-gateway.sh
./scripts/stop-gateway.sh
openclaw tui
```

## 23. Validaciones

- `COMPLETADO`: auditoria de agente, plugins, skills, approvals y sandbox
- `COMPLETADO`: verificacion de ausencia de `.git` interno
- `COMPLETADO`: verificacion de archivos de identidad
- `NO BLOQUEANTE`: la verificacion final de comportamiento queda manual en TUI

## 24. Backups

- `COMPLETADO`: backup del workspace generado en `/Users/inma/.openclaw/backups/real-estate-phase4-0/20260712-123937`

## 25. Rollback

- Restaurar archivos del workspace desde el backup
- Reponer `BOOTSTRAP.md` si se requiere
- Revertir cambios del repo en `openclaw-workspace/` y `docs/implementation/`
- No hay rollback global de OpenClaw porque no se aplicaron cambios sensibles de config

## 26. Riesgos pendientes

- `NO BLOQUEANTE`: superficie amplia de tools heredadas
- `NO BLOQUEANTE`: plugins globales de otros fines disponibles
- `NO BLOQUEANTE`: `openclaw models status` reporta el default/global del agente `main` y no refleja por si solo el modelo de `real-estate-agent`
- `PENDIENTE DE APROBACION`: cierre de la politica minima por agente

## 27. Criterio de salida

- `COMPLETADO`: workspace listo para sesion nueva
- `PENDIENTE DE APROBACION`: politica minima de plugins/tools
- `PENDIENTE DE APROBACION`: validacion manual de identidad y comportamiento

## 28. Proximo paso: 4A

Despues de aprobar la politica y validar manualmente a Carlos:

`Fase 4A — infraestructura del plugin TypeScript y cliente HTTP compartido.`

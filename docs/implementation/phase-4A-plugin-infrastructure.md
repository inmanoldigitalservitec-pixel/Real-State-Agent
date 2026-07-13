# Fase 4A Plugin Infrastructure

## Scope

This phase introduces the OpenClaw plugin foundation for future business tools without changing backend behavior.

## Deliverables

- `openclaw-workspace/plugins/real-estate-tools/`
- valid `openclaw.plugin.json`
- compiled TypeScript entry
- shared `agent-core` HTTP client
- envelope parsing
- structured errors
- timeout and abort support
- correlation IDs
- sanitized logging and redaction
- diagnostic tool `agent_core_health`
- unit tests
- smoke test against `/health`
- runtime registration notes and rollback path

## Safety constraints

- No direct Supabase access from the plugin.
- No commercial tools yet.
- No backend contract changes in Phase 4A.
- No global plugin policy change unless agent-scoped isolation is insufficient.

## Runtime isolation target

- `agent_core_health` must be callable from `real-estate-agent`.
- `agent_core_health` must not be available to `main`.

## Rollback

Rollback for Phase 4A consists of:

1. disable or unlink the local plugin install;
2. remove any agent-scoped tool overrides for `real-estate-agent`;
3. restart the gateway;
4. keep repo code if only local config needs rollback, or revert only Phase 4A files if repo rollback is required.

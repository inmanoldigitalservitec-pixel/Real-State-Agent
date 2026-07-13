# AGENTS

## Purpose

This repository hosts the Real State Agent MVP as a `pnpm` monorepo for a real-estate conversational assistant backed by `agent-core`, Supabase, and an isolated OpenClaw agent workspace.

## Workspace layout

- `apps/agent-core`: internal HTTP backend, orchestration boundary, validation layer, and persistence gateway.
- `apps/web-chat`: public chat frontend scaffold.
- `packages/shared`: shared TypeScript contracts, DTOs, schemas, constants, and helpers.
- `openclaw-workspace`: isolated OpenClaw workspace for `real-estate-agent`, including identity files, local scripts, and plugin work.
- `supabase`: database schema, migrations, storage setup, and seed data.
- `docs`: product, behavior, architecture, and implementation references.

## Current state

The repository is no longer an early scaffold. The current codebase already includes:

- monorepo architecture and shared TypeScript tooling;
- Supabase schema, migrations, storage, and demo seed data;
- repositories and services for catalog, conversations, leads, visits, events, and handoff;
- internal HTTP API routes under `/internal/*`;
- Bearer authentication for internal routes;
- sanitized DTOs and shared API envelopes;
- conversational memory persistence;
- lead capture, visit requests, and human handoff flows;
- unit tests, integration tests, and smoke tests;
- OpenClaw Phase 4.0 completed for local agent setup;
- isolated agent `real-estate-agent`;
- healthy local gateway target and workspace identity for Carlos;
- OpenClaw TypeScript plugin `real-estate-tools`;
- active Carlos tools `agent_core_health`, `search_properties`, and `get_property_assets`;
- commercial skill `real-estate-sales-advisor`;
- geography handling for broad `Santo Domingo` searches in `agent-core`.

## Current implementation focus

The current project focus is operational hardening and documentation of the working Carlos flow. The old Phase 4A-only constraints are historical and no longer describe the active repository state.

For future work, prefer small, documented increments:

- keep Carlos isolated as `real-estate-agent`;
- expose new OpenClaw tools only after confirming the corresponding `agent-core` contract;
- document any backend contract gap before changing schemas;
- validate `main` does not receive real-estate tools;
- do not commit or push unless explicitly requested.

## Architecture rules

- OpenClaw does not access Supabase directly.
- All business logic must pass through `apps/agent-core`.
- OpenClaw tools use private HTTP calls to `agent-core` under `/internal/*` when business actions are required.
- OpenClaw tool implementations live in a dedicated TypeScript plugin.
- The commercial skill remains separate from the tool implementation layer.
- `agent-core` remains the security, validation, and persistence boundary.
- Supabase is the source of truth for commercial and conversational data.
- The agent `real-estate-agent` must remain isolated from `main`.
- Do not modify backend contracts unless a real gap is first identified and documented.
- Do not add new database tables unless the need is documented first.
- Do not commit or push unless explicitly requested.

## Documentation sources of truth

Use these documents as the primary current references:

- [README.md](/Users/inma/Documents/Real%20State%20Agent/README.md)
- [docs/getting-started.md](/Users/inma/Documents/Real%20State%20Agent/docs/getting-started.md)
- [docs/architecture.md](/Users/inma/Documents/Real%20State%20Agent/docs/architecture.md)
- [docs/carlos-operator-guide.md](/Users/inma/Documents/Real%20State%20Agent/docs/carlos-operator-guide.md)
- [docs/commands.md](/Users/inma/Documents/Real%20State%20Agent/docs/commands.md)
- [docs/tools-and-capabilities.md](/Users/inma/Documents/Real%20State%20Agent/docs/tools-and-capabilities.md)
- [docs/environment.md](/Users/inma/Documents/Real%20State%20Agent/docs/environment.md)
- [docs/testing.md](/Users/inma/Documents/Real%20State%20Agent/docs/testing.md)
- [docs/troubleshooting.md](/Users/inma/Documents/Real%20State%20Agent/docs/troubleshooting.md)
- [docs/tool-map.md](/Users/inma/Documents/Real%20State%20Agent/docs/tool-map.md)
- [docs/memory-map.md](/Users/inma/Documents/Real%20State%20Agent/docs/memory-map.md)
- [docs/sales-flow.md](/Users/inma/Documents/Real%20State%20Agent/docs/sales-flow.md)
- [docs/conversation-guide.md](/Users/inma/Documents/Real%20State%20Agent/docs/conversation-guide.md)

Documents under `docs/research/` and `docs/implementation/phase-*` are historical snapshots unless a current guide explicitly points to them.

## Working style

- Keep changes minimal and incremental.
- Prefer TypeScript and ESM across the workspace.
- Reuse existing shared contracts before creating local duplicates.
- Treat OpenClaw integration as infrastructure around the existing backend, not as a replacement for it.

## Commands

- `pnpm install`
- `pnpm build`
- `pnpm typecheck`
- `pnpm --filter @real-estate-agent/shared build`
- `pnpm --filter @real-estate-agent/agent-core test:unit`
- `pnpm --filter @real-estate-agent/agent-core test:integration`
- `pnpm --filter @real-estate-agent/agent-core smoke:supabase`
- `pnpm --filter @real-estate-agent/agent-core smoke:internal-api`
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools build`
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck`
- `pnpm --filter @real-estate-agent/openclaw-real-estate-tools test`

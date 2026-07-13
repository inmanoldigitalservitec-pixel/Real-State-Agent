# OpenClaw Phase 4 Complete Architecture

## Goal

Define the approved boundary between the OpenClaw runtime and the Real State Agent backend before Phase 4A plugin work begins.

## Approved architecture

```text
Customer
  -> channel / session
  -> OpenClaw runtime
  -> real-estate-tools plugin
  -> shared HTTP client
  -> agent-core /internal/*
  -> services + repositories
  -> Supabase
```

## Core decisions

- OpenClaw is the orchestration and conversation runtime.
- `agent-core` is the business boundary.
- Supabase is never called directly by OpenClaw tools.
- All sensitive validation, persistence, and business rules remain in `agent-core`.
- Shared contracts remain in `packages/shared`.
- The commercial skill and the executable tools are separate concerns.

## OpenClaw scope

- Maintain identity and conversation behavior for Carlos.
- Select tools when a business action is required.
- Use trusted runtime context plus backend responses.
- Avoid inventing commercial facts when backend confirmation is missing.

## Plugin scope

- Expose TypeScript-native OpenClaw tools.
- Hold the shared HTTP client used by all future tools.
- Apply request timeouts, abort handling, correlation IDs, and secret redaction.
- Normalize API envelopes and structured failures.
- Keep unsafe or sensitive identifiers outside free-form model control.

## Agent Core scope

- Authenticate internal callers.
- Validate inputs and map DTOs.
- Execute domain services and repository calls.
- Persist conversations, leads, visits, and events.
- Return sanitized success and failure envelopes.

## Data boundaries

- OpenClaw reads and writes business data only through `agent-core`.
- `agent-core` is responsible for deciding what becomes persistent state.
- Supabase remains the source of truth for catalog, conversation, and conversion data.

## Isolation rules

- `real-estate-agent` must stay isolated from `main`.
- Phase 4A runtime validation must prove that the diagnostic tool is not available to `main`.
- Avoid global plugin policy changes unless no agent-scoped alternative exists.

## Phase 4A output

Phase 4A is complete only when the repository contains:

- a valid OpenClaw TypeScript plugin scaffold;
- a manifest that matches the runtime entry;
- a shared HTTP client for `agent-core`;
- structured error and envelope parsing;
- timeout and `AbortSignal` support;
- correlation IDs and sanitized logging;
- a harmless diagnostic tool `agent_core_health`;
- unit tests and a smoke test;
- runtime registration limited to `real-estate-agent`.

## Phase 4A non-goals

- no commercial property tools yet;
- no new backend endpoints;
- no direct Supabase access from the plugin;
- no commercial memory implementation inside OpenClaw;
- no web-chat feature work;
- no production lead, visit, or handoff tool rollout yet.

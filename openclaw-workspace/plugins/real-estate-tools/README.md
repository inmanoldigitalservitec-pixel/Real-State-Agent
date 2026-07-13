# Real Estate Tools Plugin

OpenClaw TypeScript plugin for the isolated `real-estate-agent` workspace.

## Current scope

- shared HTTP client for `agent-core`;
- structured envelope parsing;
- timeout and abort handling;
- correlation IDs;
- sanitized logging and redaction;
- diagnostic tool `agent_core_health`;
- property search tool `search_properties`;
- property asset tool `get_property_assets`;
- conversation state updates through `agent-core`;
- isolation for `real-estate-agent`.

## Commands

```bash
pnpm --filter @real-estate-agent/openclaw-real-estate-tools build
pnpm --filter @real-estate-agent/openclaw-real-estate-tools typecheck
pnpm --filter @real-estate-agent/openclaw-real-estate-tools test
pnpm --filter @real-estate-agent/openclaw-real-estate-tools smoke:health
pnpm --filter @real-estate-agent/openclaw-real-estate-tools smoke:search-properties
pnpm --filter @real-estate-agent/openclaw-real-estate-tools plugin:validate
```

## Runtime notes

- `agent_core_health` calls `GET /health`.
- `search_properties` calls `POST /internal/properties/search`.
- `get_property_assets` uses property media/document routes through `agent-core`.
- `/internal/*` calls require a bearer token from `OPENCLAW_AGENT_CORE_API_KEY`.
- `OPENCLAW_AGENT_CORE_API_KEY` must match `AGENT_INTERNAL_API_KEY` functionally.
- Secrets must stay in local environment variables or local OpenClaw config, never in versioned files.
- The compiled plugin entry lives at `dist/src/index.js`.

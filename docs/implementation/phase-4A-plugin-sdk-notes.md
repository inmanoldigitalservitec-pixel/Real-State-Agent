# Fase 4A Plugin SDK Notes

## Version inspected

- `OpenClaw 2026.6.8 (844f405)`

## Evidence paths

- `~/.openclaw/extensions/openclaw-test-tool-plugin/src/index.js`
- `~/.openclaw/extensions/openclaw-test-tool-plugin/openclaw.plugin.json`
- `~/.openclaw/extensions/openclaw-macos-control-center/src/index.ts`
- `~/.npm-global/lib/node_modules/openclaw/dist/plugin-sdk/tool-plugin.d.ts`
- `~/.npm-global/lib/node_modules/openclaw/dist/extensions/canvas/openclaw.plugin.json`

## Confirmed plugin pattern

- Tool plugins are declared with `defineToolPlugin` from `openclaw/plugin-sdk/tool-plugin`.
- Tool schemas use TypeBox.
- The manifest lives in `openclaw.plugin.json`.
- The runtime entry is a built JS module referenced from package metadata and plugin commands.

## Confirmed execute signature

```ts
async execute(params, config, context)
```

Where `context` includes:

- `api`
- `signal`
- `toolCallId`
- optional `onUpdate`

## Confirmed runtime context

The wider tool context and plugin runtime types expose useful trusted data such as:

- `agentId`
- `sessionId`
- `sessionKey`
- `workspaceDir`
- `agentDir`
- sandbox/capability metadata

## Confirmed CLI support

- `openclaw plugins build --root <path> --entry <path>`
- `openclaw plugins validate --root <path> --entry <path>`
- `openclaw plugins install <path> --link`
- `openclaw plugins enable <id>`
- `openclaw plugins inspect <id> --runtime --json`
- `openclaw gateway restart`

## Policy findings

- Tool policy supports agent-scoped `allow`, `alsoAllow`, and `deny`.
- Global `plugins.allow` and `plugins.deny` exist, but they affect shared runtime/plugin loading and are riskier for `main`.
- For Phase 4A, agent-scoped tool exposure is the safer isolation strategy.

## Decisions adopted

- Use a compiled TypeScript plugin rather than direct `.ts` runtime loading.
- Keep Phase 4A to one harmless tool: `agent_core_health`.
- Build a shared client now with auth support, but allow unauthenticated health checks.
- Avoid backend or Supabase changes in this phase.
- Validate runtime registration and agent isolation before declaring Phase 4A complete.

# AGENTS

## Purpose

This repository hosts the Real State Agent MVP as a `pnpm` monorepo.

## Workspace layout

- `apps/agent-core`: backend HTTP service for orchestration and future agent logic.
- `apps/web-chat`: frontend client for the public chat experience.
- `packages/shared`: shared TypeScript contracts, constants and helpers.
- `openclaw-workspace`: reserved workspace for future OpenClaw files and skills.
- `supabase`: reserved folder for future schema, migrations and local setup.
- `docs`: product and behavior definitions.

## Current scope

The current scaffold only establishes the technical base:
- workspace configuration;
- backend compile and dev server;
- frontend compile and dev server;
- shared package build and typing;
- development scripts.

## Working rules

- Keep changes minimal and incremental.
- Prefer TypeScript and ESM across the workspace.
- Do not add Supabase, OpenClaw or business tools until explicitly requested.
- Reuse `packages/shared` for cross-app types before duplicating contracts.

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm dev:core`
- `pnpm dev:web`
- `pnpm build`
- `pnpm typecheck`

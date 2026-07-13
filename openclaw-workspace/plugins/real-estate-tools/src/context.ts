import type { OpenClawPluginToolContext, ToolPluginExecutionContext } from "openclaw/plugin-sdk/tool-plugin";
import { AgentCoreClientError } from "./client/errors.js";
import type { TrustedToolContext, TrustedToolFactoryContext } from "./types.js";

export function buildTrustedToolContext(context: ToolPluginExecutionContext): TrustedToolContext {
  const runtimeContext = extractRuntimeContext(context);
  const trustedContext = resolveTrustedToolFactoryContext(runtimeContext);

  return {
    ...trustedContext,
    toolCallId: context.toolCallId
  };
}

export function buildTrustedToolFactoryContext(toolContext: OpenClawPluginToolContext): TrustedToolFactoryContext {
  return resolveTrustedToolFactoryContext({
    agentId: toolContext.agentId,
    sessionId: toolContext.sessionId,
    sessionKey: toolContext.sessionKey,
    workspaceDir: toolContext.workspaceDir
  });
}

export function withToolCallId(context: TrustedToolFactoryContext, toolCallId: string): TrustedToolContext {
  return {
    ...context,
    toolCallId
  };
}

export function parseAgentIdFromSessionKey(sessionKey: string | undefined): string | undefined {
  if (!sessionKey || /\s/.test(sessionKey)) {
    return undefined;
  }

  const parts = sessionKey.split(":");

  if (parts.length !== 3 || parts[0] !== "agent") {
    return undefined;
  }

  const [, agentId, sessionId] = parts;

  if (!agentId || !sessionId) {
    return undefined;
  }

  return agentId;
}

function resolveTrustedToolFactoryContext(runtimeContext: {
  agentId?: unknown;
  sessionId?: unknown;
  sessionKey?: unknown;
  runId?: unknown;
  workspaceDir?: unknown;
}): TrustedToolFactoryContext {
  const explicitAgentId = readString(runtimeContext.agentId);
  const sessionKey = readString(runtimeContext.sessionKey);
  const sessionAgentId = resolveAgentIdFromTrustedSessionKey(sessionKey);

  if (explicitAgentId && sessionAgentId && explicitAgentId !== sessionAgentId) {
    throw new AgentCoreClientError({
      message: "OpenClaw runtime provided inconsistent trusted agent context",
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }

  const agentId = explicitAgentId ?? sessionAgentId;

  return {
    agentId,
    agentIdSource: explicitAgentId ? "explicit" : sessionAgentId ? "sessionKey" : "unavailable",
    sessionId: readString(runtimeContext.sessionId),
    sessionKey,
    runId: readString(runtimeContext.runId),
    workspaceDir: readString(runtimeContext.workspaceDir)
  };
}

function resolveAgentIdFromTrustedSessionKey(sessionKey: string | undefined) {
  // OpenClaw's public routing SDK exposes resolveAgentIdFromSessionKey; this
  // fallback mirrors the same constrained agent-session shape for test and
  // local package contexts where the host SDK is not resolvable.
  return parseAgentIdFromSessionKey(sessionKey);
}

function extractRuntimeContext(context: ToolPluginExecutionContext) {
  const api = context.api as Record<string, unknown>;
  const runContext = (api.runContext ?? {}) as Record<string, unknown>;
  const toolContext = (runContext.toolContext ?? {}) as Record<string, unknown>;

  return {
    agentId: api.agentId ?? runContext.agentId ?? toolContext.agentId,
    sessionId: api.sessionId ?? runContext.sessionId ?? toolContext.sessionId,
    sessionKey: api.sessionKey ?? runContext.sessionKey ?? toolContext.sessionKey,
    runId: api.runId ?? runContext.runId ?? toolContext.runId,
    workspaceDir: api.workspaceDir ?? runContext.workspaceDir ?? toolContext.workspaceDir
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

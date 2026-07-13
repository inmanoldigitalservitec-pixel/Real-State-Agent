import type { ToolPluginExecutionContext } from "openclaw/plugin-sdk/tool-plugin";
import { resolvePluginConfig } from "../config.js";
import { buildTrustedToolContext } from "../context.js";
import { AgentCoreClient } from "../client/agent-core-client.js";
import { createCorrelationId } from "../telemetry/correlation.js";
import { createLogger } from "../telemetry/logger.js";
import type { AgentCorePluginConfig, HealthToolResult } from "../types.js";

export const emptyParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {}
} as const;

export async function executeAgentCoreHealth(
  _params: Record<string, never>,
  rawConfig: AgentCorePluginConfig | undefined,
  context: ToolPluginExecutionContext
): Promise<HealthToolResult> {
  context.signal?.throwIfAborted?.();

  const trustedContext = buildTrustedToolContext(context);
  const resolvedConfig = resolvePluginConfig(rawConfig);
  const logger = createLogger(context.api.logger);
  const correlationId = createCorrelationId("agent_core_health", trustedContext.agentId);
  const client = new AgentCoreClient(resolvedConfig, logger);
  const health = await client.getHealth({
    correlationId,
    signal: context.signal
  });

  logger.info("agent_core_health completed", {
    correlationId,
    toolCallId: trustedContext.toolCallId,
    agentId: trustedContext.agentId,
    service: health.service
  });

  return {
    ok: true,
    status: health.status,
    service: health.service,
    version: health.version,
    timestamp: health.timestamp,
    correlationId
  };
}

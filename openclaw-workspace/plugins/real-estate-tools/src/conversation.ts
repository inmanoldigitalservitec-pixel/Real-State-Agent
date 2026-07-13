import type { ToolPluginExecutionContext } from "openclaw/plugin-sdk/tool-plugin";
import { AgentCoreClient } from "./client/agent-core-client.js";
import { AgentCoreClientError } from "./client/errors.js";
import { resolvePluginConfig } from "./config.js";
import { buildTrustedToolContext } from "./context.js";
import { createCorrelationId } from "./telemetry/correlation.js";
import { createLogger } from "./telemetry/logger.js";
import type {
  AgentCorePluginConfig,
  ConversationContextClientResult,
  MessageClientResult,
  ResolveConversationClientResult,
  SaveConversationMessageClientInput
} from "./types.js";
import type { TrustedToolContext } from "./types.js";

export type TrustedConversation = ResolveConversationClientResult & {
  correlationId: string;
  sessionKey: string;
  agentId?: string;
  runId?: string;
  toolCallId: string;
};

export async function resolveTrustedConversation(
  rawConfig: AgentCorePluginConfig | undefined,
  context: ToolPluginExecutionContext,
  trustedContext = buildTrustedToolContext(context)
): Promise<TrustedConversation> {
  const resolvedConfig = resolvePluginConfig(rawConfig);

  if (!trustedContext.sessionKey) {
    throw new AgentCoreClientError({
      message: "OpenClaw runtime did not provide a trusted sessionKey",
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }

  if (!resolvedConfig.companyId) {
    throw new AgentCoreClientError({
      message: "Missing private plugin companyId configuration",
      code: "CONFIGURATION_ERROR"
    });
  }

  const logger = createLogger(context.api.logger);
  const client = new AgentCoreClient(resolvedConfig, logger);
  const correlationId = createCorrelationId("resolve_conversation", trustedContext.agentId);
  const resolved = await client.resolveConversation({
    payload: {
      companyId: resolvedConfig.companyId,
      channel: resolvedConfig.channel,
      externalSessionId: trustedContext.sessionKey,
      metadata: trustedContext.runId ? { runId: trustedContext.runId } : undefined
    },
    correlationId,
    signal: context.signal
  });

  logger.info("conversation resolved", {
    correlationId,
    agentId: trustedContext.agentId,
    toolCallId: trustedContext.toolCallId,
    created: resolved.created
  });

  return {
    ...resolved,
    correlationId,
    sessionKey: trustedContext.sessionKey,
    agentId: trustedContext.agentId,
    runId: trustedContext.runId,
    toolCallId: trustedContext.toolCallId
  };
}

export async function loadTrustedConversationContext(input: {
  rawConfig: AgentCorePluginConfig | undefined;
  context: ToolPluginExecutionContext;
  trustedContext?: TrustedToolContext;
  conversationId: string;
  messageLimit?: number;
}): Promise<ConversationContextClientResult> {
  const trustedContext = input.trustedContext ?? buildTrustedToolContext(input.context);
  const resolvedConfig = resolvePluginConfig(input.rawConfig);
  const logger = createLogger(input.context.api.logger);
  const client = new AgentCoreClient(resolvedConfig, logger);
  const correlationId = createCorrelationId("conversation_context", trustedContext.agentId);

  return client.getConversationContext({
    conversationId: input.conversationId,
    messageLimit: input.messageLimit,
    correlationId,
    signal: input.context.signal
  });
}

export async function saveTrustedConversationMessage(input: {
  rawConfig: AgentCorePluginConfig | undefined;
  context: ToolPluginExecutionContext;
  trustedContext?: TrustedToolContext;
  conversation: TrustedConversation;
  message: Omit<SaveConversationMessageClientInput, "conversationId" | "companyId" | "clientMessageId"> & {
    clientMessageId?: string;
  };
}): Promise<MessageClientResult> {
  const trustedContext = input.trustedContext ?? buildTrustedToolContext(input.context);
  const resolvedConfig = resolvePluginConfig(input.rawConfig);
  const logger = createLogger(input.context.api.logger);
  const client = new AgentCoreClient(resolvedConfig, logger);
  const correlationId = createCorrelationId("conversation_message", trustedContext.agentId);
  const clientMessageId =
    input.message.clientMessageId ??
    createConversationClientMessageId({
      sessionKey: input.conversation.sessionKey,
      runId: input.conversation.runId,
      toolCallId: input.conversation.toolCallId,
      role: input.message.role
    });

  return client.saveConversationMessage({
    payload: {
      ...input.message,
      conversationId: input.conversation.conversationId,
      companyId: input.conversation.companyId,
      clientMessageId
    },
    correlationId,
    signal: input.context.signal
  });
}

export function createConversationClientMessageId(input: {
  sessionKey: string;
  role: string;
  runId?: string;
  toolCallId?: string;
}) {
  const basis = [input.sessionKey, input.runId ?? input.toolCallId ?? "unknown-run", input.role].join(":");
  const encoded = Buffer.from(basis).toString("base64url").slice(0, 80);

  return `ocmsg_${encoded}`;
}

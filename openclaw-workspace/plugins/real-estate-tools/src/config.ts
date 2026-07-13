import type { AgentCorePluginConfig, ResolvedAgentCorePluginConfig } from "./types.js";

export const pluginConfigSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    baseUrl: {
      type: "string",
      description: "Base URL for the local agent-core HTTP service."
    },
    internalApiKeyEnvVar: {
      type: "string",
      description: "Environment variable name holding the internal bearer token."
    },
    companyId: {
      type: "string",
      description: "Private company UUID used for internal conversation operations."
    },
    channel: {
      type: "string",
      enum: ["web"],
      description: "Internal conversation channel. Must match the backend channel enum."
    },
    timeoutMs: {
      type: "integer",
      minimum: 1000,
      maximum: 30000,
      description: "Default HTTP timeout for agent-core requests."
    },
    logLevel: {
      type: "string",
      enum: ["debug", "info", "warn", "error"],
      description: "Sanitized plugin log level."
    }
  }
} as const;

const DEFAULT_BASE_URL = process.env.OPENCLAW_AGENT_CORE_BASE_URL?.trim() || "http://127.0.0.1:8787";
const DEFAULT_TIMEOUT_MS = 10_000;

export function resolvePluginConfig(input: unknown): ResolvedAgentCorePluginConfig {
  const candidate = (input ?? {}) as AgentCorePluginConfig;
  const baseUrl = normalizeBaseUrl(candidate.baseUrl ?? DEFAULT_BASE_URL);
  const timeoutMs = normalizeTimeout(candidate.timeoutMs);
  const logLevel = normalizeLogLevel(candidate.logLevel);
  const internalApiKeyEnvVar = normalizeEnvVarName(
    candidate.internalApiKeyEnvVar ?? "OPENCLAW_AGENT_CORE_API_KEY"
  );
  const companyId = normalizeOptionalUuid(candidate.companyId);
  const channel = normalizeChannel(candidate.channel);

  return {
    baseUrl,
    internalApiKeyEnvVar,
    companyId,
    channel,
    timeoutMs,
    logLevel
  };
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!/^https?:\/\//.test(trimmed)) {
    throw new Error(`Invalid agent-core base URL: ${value}`);
  }

  return trimmed;
}

function normalizeTimeout(value: number | undefined) {
  if (value === undefined) {
    return DEFAULT_TIMEOUT_MS;
  }

  if (!Number.isInteger(value) || value < 1000 || value > 30000) {
    throw new Error(`Invalid timeoutMs: ${value}`);
  }

  return value;
}

function normalizeLogLevel(value: AgentCorePluginConfig["logLevel"]) {
  return value ?? "info";
}

function normalizeChannel(value: AgentCorePluginConfig["channel"]) {
  if (value === undefined) {
    return "web";
  }

  if (value !== "web") {
    throw new Error(`Invalid channel: ${value}`);
  }

  return value;
}

function normalizeOptionalUuid(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)) {
    throw new Error(`Invalid companyId: ${value}`);
  }

  return trimmed;
}

function normalizeEnvVarName(value: string) {
  const trimmed = value.trim();

  if (!/^[A-Z][A-Z0-9_]{1,127}$/.test(trimmed)) {
    throw new Error(`Invalid internalApiKeyEnvVar: ${value}`);
  }

  return trimmed;
}

export type PublicChatSecurityConfig = {
  enabled: boolean;
  allowedOrigins: string[];
  maxBodyBytes: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  maxConcurrentRequests: number;
  timeoutMs: number;
  trustProxy: boolean;
};

function parseBoolean(
  value: string | undefined,
  fallback: boolean
): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseOrigins(value: string | undefined): string[] {
  const source = value?.trim() || "http://localhost:5173";

  return Array.from(
    new Set(
      source
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean)
    )
  );
}

export function loadPublicChatSecurityConfig(
  env: NodeJS.ProcessEnv = process.env
): PublicChatSecurityConfig {
  return {
    enabled: parseBoolean(
      env.PUBLIC_CHAT_ENABLED,
      true
    ),
    allowedOrigins: parseOrigins(
      env.PUBLIC_CHAT_ALLOWED_ORIGINS
    ),
    maxBodyBytes: parsePositiveInteger(
      env.PUBLIC_CHAT_MAX_BODY_BYTES,
      16 * 1024
    ),
    rateLimitWindowMs: parsePositiveInteger(
      env.PUBLIC_CHAT_RATE_LIMIT_WINDOW_MS,
      60_000
    ),
    rateLimitMaxRequests: parsePositiveInteger(
      env.PUBLIC_CHAT_RATE_LIMIT_MAX_REQUESTS,
      20
    ),
    maxConcurrentRequests: parsePositiveInteger(
      env.PUBLIC_CHAT_MAX_CONCURRENT_REQUESTS,
      3
    ),
    timeoutMs:
      parsePositiveInteger(
        env.PUBLIC_CHAT_TIMEOUT_SECONDS,
        120
      ) * 1_000,
    trustProxy: parseBoolean(
      env.PUBLIC_CHAT_TRUST_PROXY,
      false
    )
  };
}

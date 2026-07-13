import { randomUUID } from "node:crypto";
import type {
  Context,
  MiddlewareHandler
} from "hono";
import type {
  PublicChatSecurityConfig
} from "../config/public-chat-config";
import { HttpError } from "./error-handler";

export type PublicSecurityRuntimeOptions = {
  now?: () => number;
  createRequestId?: () => string;
};

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

function getRateLimitKey(
  context: Context,
  trustProxy: boolean
): string {
  if (trustProxy) {
    const cloudflareIp = context.req
      .header("cf-connecting-ip")
      ?.trim();

    if (cloudflareIp) {
      return `ip:${cloudflareIp}`;
    }

    const forwardedFor = context.req
      .header("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

    if (forwardedFor) {
      return `ip:${forwardedFor}`;
    }
  }

  /*
   * Hono's generic Request abstraction does not expose a trusted socket
   * address. Until a trusted reverse proxy is explicitly enabled, all
   * direct traffic shares one conservative rate-limit bucket.
   */
  return "ip:direct";
}

export function createPublicSecurityMiddleware(
  config: PublicChatSecurityConfig,
  runtime: PublicSecurityRuntimeOptions = {}
): {
  common: MiddlewareHandler;
  chatRateLimit: MiddlewareHandler;
  chatConcurrency: MiddlewareHandler;
  chatTimeout: MiddlewareHandler;
} {
  const now = runtime.now ?? Date.now;
  const createRequestId =
    runtime.createRequestId ?? randomUUID;
  const allowedOrigins = new Set(
    config.allowedOrigins.map(normalizeOrigin)
  );
  const requestHistory = new Map<string, number[]>();

  let activeRequests = 0;

  const common: MiddlewareHandler = async (
    context,
    next
  ) => {
    const requestId = createRequestId();
    const origin = context.req.header("origin");
    const normalizedOrigin = origin
      ? normalizeOrigin(origin)
      : undefined;

    context.header(
      "X-Content-Type-Options",
      "nosniff"
    );
    context.header(
      "Referrer-Policy",
      "no-referrer"
    );
    context.header("Cache-Control", "no-store");
    context.header("X-Request-Id", requestId);
    context.header("Vary", "Origin");

    if (normalizedOrigin) {
      if (!allowedOrigins.has(normalizedOrigin)) {
        throw new HttpError(
          403,
          "CORS_ORIGIN_DENIED",
          "Origin is not allowed"
        );
      }

      context.header(
        "Access-Control-Allow-Origin",
        normalizedOrigin
      );
      context.header(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
      );
      context.header(
        "Access-Control-Allow-Headers",
        "Content-Type"
      );
      context.header(
        "Access-Control-Max-Age",
        "600"
      );
    }

    if (context.req.method === "OPTIONS") {
      return context.body(null, 204);
    }

    await next();
  };

  const chatRateLimit: MiddlewareHandler = async (
    context,
    next
  ) => {
    const key = getRateLimitKey(
      context,
      config.trustProxy
    );
    const currentTime = now();
    const cutoff =
      currentTime - config.rateLimitWindowMs;

    const recent = (
      requestHistory.get(key) ?? []
    ).filter((timestamp) => timestamp > cutoff);

    if (
      recent.length >=
      config.rateLimitMaxRequests
    ) {
      throw new HttpError(
        429,
        "RATE_LIMITED",
        "Too many requests",
        true
      );
    }

    recent.push(currentTime);
    requestHistory.set(key, recent);

    await next();
  };

  const chatConcurrency: MiddlewareHandler = async (
    _context,
    next
  ) => {
    if (
      activeRequests >=
      config.maxConcurrentRequests
    ) {
      throw new HttpError(
        429,
        "TOO_MANY_CONCURRENT_REQUESTS",
        "Too many concurrent chat requests",
        true
      );
    }

    activeRequests += 1;

    try {
      await next();
    } finally {
      activeRequests -= 1;
    }
  };

  const chatTimeout: MiddlewareHandler = async (
    _context,
    next
  ) => {
    let timeoutId:
      | ReturnType<typeof setTimeout>
      | undefined;

    await Promise.race([
      next(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new HttpError(
              504,
              "CHAT_TIMEOUT",
              "Chat request timed out",
              true
            )
          );
        }, config.timeoutMs);
      })
    ]).finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
  };

  return {
    common,
    chatRateLimit,
    chatConcurrency,
    chatTimeout
  };
}

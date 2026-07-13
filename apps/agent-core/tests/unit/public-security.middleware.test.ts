import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type {
  AppServices,
  CreateAppOptions
} from "../../src/app";
import {
  createApp
} from "../../src/app";
import type {
  PublicChatRouteService
} from "../../src/routes/public/chat";
import type {
  PublicChatSecurityConfig
} from "../../src/config/public-chat-config";

function unusedInternalServices(): AppServices {
  return {} as AppServices;
}

function createConfig(
  overrides: Partial<PublicChatSecurityConfig> = {}
): PublicChatSecurityConfig {
  return {
    enabled: true,
    allowedOrigins: [
      "http://localhost:5173",
      "https://chat.example.com"
    ],
    maxBodyBytes: 512,
    rateLimitWindowMs: 60_000,
    rateLimitMaxRequests: 20,
    maxConcurrentRequests: 3,
    timeoutMs: 120_000,
    trustProxy: false,
    ...overrides
  };
}

function createOptions(
  configOverrides: Partial<PublicChatSecurityConfig> = {}
): CreateAppOptions {
  return {
    publicChatConfig:
      createConfig(configOverrides),
    publicSecurityRuntime: {
      createRequestId: () =>
        "request-id-12345678"
    }
  };
}

function createService(): PublicChatRouteService {
  return {
    chat: vi.fn(async (input) => ({
      success: true as const,
      data: {
        sessionId:
          input.sessionId ??
          "session_generated_12345678",
        message: "Hola",
        payloads: [
          {
            type: "text" as const,
            text: "Hola"
          }
        ]
      }
    }))
  };
}

describe("public security middleware", () => {
  it("adds security and request ID headers", async () => {
    const app = createApp(
      unusedInternalServices(),
      createService(),
      createOptions()
    );

    const response = await app.request(
      "/public/health"
    );

    expect(response.status).toBe(200);
    expect(
      response.headers.get(
        "x-content-type-options"
      )
    ).toBe("nosniff");
    expect(
      response.headers.get("referrer-policy")
    ).toBe("no-referrer");
    expect(
      response.headers.get("cache-control")
    ).toBe("no-store");
    expect(
      response.headers.get("x-request-id")
    ).toBe("request-id-12345678");
  });

  it("allows configured CORS origins", async () => {
    const app = createApp(
      unusedInternalServices(),
      createService(),
      createOptions()
    );

    const response = await app.request(
      "/public/health",
      {
        headers: {
          origin:
            "https://chat.example.com"
        }
      }
    );

    expect(response.status).toBe(200);
    expect(
      response.headers.get(
        "access-control-allow-origin"
      )
    ).toBe("https://chat.example.com");
  });

  it("rejects unconfigured CORS origins", async () => {
    const app = createApp(
      unusedInternalServices(),
      createService(),
      createOptions()
    );

    const response = await app.request(
      "/public/health",
      {
        headers: {
          origin: "https://evil.example"
        }
      }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe(
      "CORS_ORIGIN_DENIED"
    );
  });

  it("handles allowed CORS preflight", async () => {
    const app = createApp(
      unusedInternalServices(),
      createService(),
      createOptions()
    );

    const response = await app.request(
      "/public/chat",
      {
        method: "OPTIONS",
        headers: {
          origin:
            "http://localhost:5173"
        }
      }
    );

    expect(response.status).toBe(204);
    expect(
      response.headers.get(
        "access-control-allow-origin"
      )
    ).toBe("http://localhost:5173");
  });

  it("rejects bodies exceeding the real byte limit", async () => {
    const service = createService();
    const app = createApp(
      unusedInternalServices(),
      service,
      createOptions({
        maxBodyBytes: 32
      })
    );

    const response = await app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          message: "x".repeat(100)
        })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error.code).toBe(
      "VALIDATION_ERROR"
    );
    expect(service.chat).not.toHaveBeenCalled();
  });

  it("rate limits public chat requests", async () => {
    const service = createService();
    const app = createApp(
      unusedInternalServices(),
      service,
      createOptions({
        rateLimitMaxRequests: 2
      })
    );

    const request = () =>
      app.request("/public/chat", {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          message: "Hola"
        })
      });

    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);

    const limited = await request();
    const body = await limited.json();

    expect(limited.status).toBe(429);
    expect(body.error.code).toBe(
      "RATE_LIMITED"
    );
  });

  it("uses trusted proxy IP only when enabled", async () => {
    const service = createService();
    const app = createApp(
      unusedInternalServices(),
      service,
      createOptions({
        trustProxy: true,
        rateLimitMaxRequests: 1
      })
    );

    const first = await app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json",
          "cf-connecting-ip": "203.0.113.10"
        },
        body: JSON.stringify({
          message: "Uno"
        })
      }
    );

    const second = await app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json",
          "cf-connecting-ip": "203.0.113.11"
        },
        body: JSON.stringify({
          message: "Dos"
        })
      }
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it("rejects excessive concurrent requests", async () => {
    let release:
      | (() => void)
      | undefined;

    const blocker = new Promise<void>(
      (resolve) => {
        release = resolve;
      }
    );

    const service: PublicChatRouteService = {
      chat: vi.fn(async (input) => {
        await blocker;

        return {
          success: true as const,
          data: {
            sessionId:
              input.sessionId ??
              "session_generated_12345678",
            message: "Hola",
            payloads: [
              {
                type: "text" as const,
                text: "Hola"
              }
            ]
          }
        };
      })
    };

    const app = createApp(
      unusedInternalServices(),
      service,
      createOptions({
        maxConcurrentRequests: 1
      })
    );

    const firstPromise = app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          message: "Primero"
        })
      }
    );

    await Promise.resolve();

    const second = await app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          message: "Segundo"
        })
      }
    );
    const body = await second.json();

    expect(second.status).toBe(429);
    expect(body.error.code).toBe(
      "TOO_MANY_CONCURRENT_REQUESTS"
    );

    release?.();
    expect((await firstPromise).status).toBe(200);
  });

  it("times out slow public chat requests", async () => {
    const service: PublicChatRouteService = {
      chat: vi.fn(
        () =>
          new Promise(() => {
            // Intentionally unresolved.
          })
      )
    };

    const app = createApp(
      unusedInternalServices(),
      service,
      createOptions({
        timeoutMs: 5
      })
    );

    const response = await app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          message: "Hola"
        })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body.error.code).toBe(
      "CHAT_TIMEOUT"
    );
  });

  it("does not register public routes when disabled", async () => {
    const app = createApp(
      unusedInternalServices(),
      createService(),
      createOptions({
        enabled: false
      })
    );

    expect(
      (
        await app.request(
          "/public/health"
        )
      ).status
    ).toBe(404);
  });
});

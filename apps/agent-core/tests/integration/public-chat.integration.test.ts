import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type {
  AppServices
} from "../../src/app";
import {
  createApp
} from "../../src/app";
import type {
  PublicChatSecurityConfig
} from "../../src/config/public-chat-config";
import {
  PublicChatService
} from "../../src/services/public-chat.service";
import type {
  PublicChatAgentClient
} from "../../src/services/public-chat.service";

function unusedInternalServices(): AppServices {
  return {} as AppServices;
}

function createSecurityConfig(): PublicChatSecurityConfig {
  return {
    enabled: true,
    allowedOrigins: [
      "http://localhost:5173"
    ],
    maxBodyBytes: 16 * 1024,
    rateLimitWindowMs: 60_000,
    rateLimitMaxRequests: 20,
    maxConcurrentRequests: 3,
    timeoutMs: 120_000,
    trustProxy: false
  };
}

describe("Public chat HTTP integration", () => {
  it("creates a session and reuses it on the next request", async () => {
    const agentClient: PublicChatAgentClient = {
      sendMessage: vi.fn(async ({ sessionId, message }) => ({
        message:
          message === "Hola Carlos"
            ? "Hola, ¿qué tipo de propiedad buscas?"
            : "Continuamos con la misma conversación.",
        payloads: [
          {
            type: "text" as const,
            text:
              message === "Hola Carlos"
                ? "Hola, ¿qué tipo de propiedad buscas?"
                : "Continuamos con la misma conversación."
          },
          {
            type: "media" as const,
            url:
              "https://cdn.example.com/property.jpg"
          }
        ]
      }))
    };

    const publicChatService = new PublicChatService(
      agentClient,
      {
        createSessionId: () =>
          "b54f2a58-746a-4bc1-a465-b377ebd44363"
      }
    );

    const app = createApp(
      unusedInternalServices(),
      publicChatService,
      {
        publicChatConfig:
          createSecurityConfig(),
        publicSecurityRuntime: {
          createRequestId: () =>
            "request-integration-12345678"
        }
      }
    );

    const health = await app.request(
      "/public/health",
      {
        headers: {
          origin:
            "http://localhost:5173"
        }
      }
    );

    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({
      success: true,
      data: {
        status: "ok"
      }
    });

    const first = await app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json",
          origin:
            "http://localhost:5173"
        },
        body: JSON.stringify({
          message: "Hola Carlos"
        })
      }
    );

    expect(first.status).toBe(200);
    expect(
      first.headers.get(
        "access-control-allow-origin"
      )
    ).toBe("http://localhost:5173");
    expect(
      first.headers.get("x-request-id")
    ).toBe(
      "request-integration-12345678"
    );

    const firstBody = await first.json();

    expect(firstBody).toEqual({
      success: true,
      data: {
        sessionId:
          "b54f2a58-746a-4bc1-a465-b377ebd44363",
        message:
          "Hola, ¿qué tipo de propiedad buscas?",
        payloads: [
          {
            type: "text",
            text:
              "Hola, ¿qué tipo de propiedad buscas?"
          },
          {
            type: "media",
            url:
              "https://cdn.example.com/property.jpg"
          }
        ]
      }
    });

    const second = await app.request(
      "/public/chat",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json",
          origin:
            "http://localhost:5173"
        },
        body: JSON.stringify({
          sessionId:
            firstBody.data.sessionId,
          message:
            "Busco en Villa Mella"
        })
      }
    );

    expect(second.status).toBe(200);

    const secondBody = await second.json();

    expect(secondBody.data.sessionId).toBe(
      firstBody.data.sessionId
    );
    expect(secondBody.data.message).toBe(
      "Continuamos con la misma conversación."
    );

    expect(agentClient.sendMessage).toHaveBeenNthCalledWith(
      1,
      {
        sessionId:
          "b54f2a58-746a-4bc1-a465-b377ebd44363",
        message: "Hola Carlos"
      }
    );

    expect(agentClient.sendMessage).toHaveBeenNthCalledWith(
      2,
      {
        sessionId:
          "b54f2a58-746a-4bc1-a465-b377ebd44363",
        message:
          "Busco en Villa Mella"
      }
    );
  });

  it("filters unsafe media before returning the HTTP response", async () => {
    const agentClient: PublicChatAgentClient = {
      sendMessage: vi.fn(async () => ({
        message: "Aquí tienes",
        payloads: [
          {
            type: "text" as const,
            text: "Aquí tienes"
          },
          {
            type: "media" as const,
            url:
              "file:///Users/inma/private.jpg"
          },
          {
            type: "media" as const,
            url:
              "http://127.0.0.1/internal.jpg"
          },
          {
            type: "media" as const,
            url:
              "https://cdn.example.com/public.jpg"
          }
        ]
      }))
    };

    const app = createApp(
      unusedInternalServices(),
      new PublicChatService(agentClient, {
        createSessionId: () =>
          "session_12345678"
      }),
      {
        publicChatConfig:
          createSecurityConfig()
      }
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
          message: "Muéstrame fotos"
        })
      }
    );

    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.data.payloads).toEqual([
      {
        type: "text",
        text: "Aquí tienes"
      },
      {
        type: "media",
        url:
          "https://cdn.example.com/public.jpg"
      }
    ]);

    expect(serialized).not.toContain(
      "file://"
    );
    expect(serialized).not.toContain(
      "127.0.0.1"
    );
    expect(serialized).not.toContain(
      "/Users/inma"
    );
  });

  it("returns a safe error when the agent fails", async () => {
    const agentClient: PublicChatAgentClient = {
      sendMessage: vi.fn(async () => {
        throw new Error(
          "token=secret provider=private workspace=/Users/inma"
        );
      })
    };

    const app = createApp(
      unusedInternalServices(),
      new PublicChatService(agentClient, {
        createSessionId: () =>
          "session_12345678"
      }),
      {
        publicChatConfig:
          createSecurityConfig()
      }
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
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: "EXTERNAL_ERROR",
        message:
          "The chat agent request failed",
        retryable: true,
        requiresClarification: false,
        requiresHuman: false
      }
    });

    expect(serialized).not.toContain(
      "secret"
    );
    expect(serialized).not.toContain(
      "private"
    );
    expect(serialized).not.toContain(
      "/Users/inma"
    );
  });

  it("rejects internal fields at the HTTP boundary", async () => {
    const agentClient: PublicChatAgentClient = {
      sendMessage: vi.fn()
    };

    const app = createApp(
      unusedInternalServices(),
      new PublicChatService(agentClient),
      {
        publicChatConfig:
          createSecurityConfig()
      }
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
          message: "Hola",
          sessionKey:
            "agent:real-estate-agent:web-secret",
          agentId: "other-agent",
          provider: "private"
        })
      }
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(
      "VALIDATION_ERROR"
    );
    expect(
      agentClient.sendMessage
    ).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import type { AppServices } from "../../src/app";
import { createApp } from "../../src/app";
import type {
  PublicChatRouteService
} from "../../src/routes/public/chat";

function createUnusedInternalServices(): AppServices {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Internal services must not be accessed by public routes"
        );
      }
    }
  ) as AppServices;
}

function createPublicChatService(): PublicChatRouteService {
  return {
    chat: vi.fn(async (input) => ({
      success: true as const,
      data: {
        sessionId:
          input.sessionId ?? "session_generated_12345678",
        message: "Hola desde Carlos",
        payloads: [
          {
            type: "text" as const,
            text: "Hola desde Carlos"
          }
        ]
      }
    }))
  };
}

describe("public chat routes", () => {
  it("returns the public health contract", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request("/public/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        status: "ok"
      }
    });

    expect(service.chat).not.toHaveBeenCalled();
  });

  it("accepts a new public chat session", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request("/public/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "Hola Carlos"
      })
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        sessionId: "session_generated_12345678",
        message: "Hola desde Carlos",
        payloads: [
          {
            type: "text",
            text: "Hola desde Carlos"
          }
        ]
      }
    });

    expect(service.chat).toHaveBeenCalledWith({
      message: "Hola Carlos"
    });
  });

  it("reuses the public session ID", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request("/public/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sessionId: "session_12345678",
        message: "Seguimos"
      })
    });

    expect(response.status).toBe(200);
    expect(service.chat).toHaveBeenCalledWith({
      sessionId: "session_12345678",
      message: "Seguimos"
    });
  });

  it("rejects malformed JSON safely", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request("/public/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{invalid"
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
        retryable: false,
        requiresClarification: true,
        requiresHuman: false
      }
    });

    expect(service.chat).not.toHaveBeenCalled();
  });

  it("rejects an empty message before calling the service", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request("/public/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "   "
      })
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(service.chat).not.toHaveBeenCalled();
  });

  it("rejects internal fields before calling the service", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request("/public/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "Hola",
        sessionKey:
          "agent:real-estate-agent:web-secret",
        agentId: "other-agent",
        provider: "private-provider"
      })
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(service.chat).not.toHaveBeenCalled();

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("sessionKey");
    expect(serialized).not.toContain("other-agent");
    expect(serialized).not.toContain("private-provider");
  });

  it("does not require internal authentication", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request("/public/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "Hola"
      })
    });

    expect(response.status).toBe(200);
  });

  it("keeps internal authentication enabled", async () => {
    const service = createPublicChatService();
    const app = createApp(
      createUnusedInternalServices(),
      service
    );

    const response = await app.request(
      "/internal/properties/search",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      }
    );

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBe(
      "Missing bearer token"
    );
  });
});

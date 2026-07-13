import { describe, expect, it, vi } from "vitest";
import {
  OpenClawAgentClientError,
  type OpenClawAgentResponse
} from "../../src/integrations/openclaw/openclaw-agent.client";
import {
  PublicChatService,
  isSafePublicMediaUrl,
  type PublicChatAgentClient
} from "../../src/services/public-chat.service";

function createClient(
  response: OpenClawAgentResponse
): PublicChatAgentClient {
  return {
    sendMessage: vi.fn(async () => response)
  };
}

describe("PublicChatService", () => {
  it("generates a new public session ID", async () => {
    const client = createClient({
      message: "Hola, soy Carlos",
      payloads: [
        {
          type: "text",
          text: "Hola, soy Carlos"
        }
      ]
    });

    const service = new PublicChatService(client, {
      createSessionId: () =>
        "b54f2a58-746a-4bc1-a465-b377ebd44363"
    });

    const result = await service.chat({
      message: "Hola"
    });

    expect(result).toEqual({
      success: true,
      data: {
        sessionId:
          "b54f2a58-746a-4bc1-a465-b377ebd44363",
        message: "Hola, soy Carlos",
        payloads: [
          {
            type: "text",
            text: "Hola, soy Carlos"
          }
        ]
      }
    });

    expect(client.sendMessage).toHaveBeenCalledWith({
      sessionId:
        "b54f2a58-746a-4bc1-a465-b377ebd44363",
      message: "Hola"
    });
  });

  it("reuses a valid public session ID", async () => {
    const client = createClient({
      message: "Continuamos",
      payloads: [
        {
          type: "text",
          text: "Continuamos"
        }
      ]
    });

    const createSessionId = vi.fn(
      () => "unused-session-id"
    );

    const service = new PublicChatService(client, {
      createSessionId
    });

    const result = await service.chat({
      sessionId: "session_12345678",
      message: "Seguimos"
    });

    expect(result.data.sessionId).toBe(
      "session_12345678"
    );
    expect(createSessionId).not.toHaveBeenCalled();
    expect(client.sendMessage).toHaveBeenCalledWith({
      sessionId: "session_12345678",
      message: "Seguimos"
    });
  });

  it("trims text payloads and builds the public message", async () => {
    const client = createClient({
      message: "internal fallback",
      payloads: [
        {
          type: "text",
          text: " Primera respuesta "
        },
        {
          type: "text",
          text: " Segunda respuesta "
        }
      ]
    });

    const service = new PublicChatService(client, {
      createSessionId: () => "session_12345678"
    });

    await expect(
      service.chat({
        message: "Hola"
      })
    ).resolves.toEqual({
      success: true,
      data: {
        sessionId: "session_12345678",
        message:
          "Primera respuesta\n\nSegunda respuesta",
        payloads: [
          {
            type: "text",
            text: "Primera respuesta"
          },
          {
            type: "text",
            text: "Segunda respuesta"
          }
        ]
      }
    });
  });

  it("keeps public HTTP and HTTPS media URLs", async () => {
    const client = createClient({
      message: "Aquí tienes",
      payloads: [
        {
          type: "text",
          text: "Aquí tienes"
        },
        {
          type: "media",
          url: "https://cdn.example.com/property.jpg"
        },
        {
          type: "media",
          url: "http://media.example.org/floor-plan.pdf"
        }
      ]
    });

    const service = new PublicChatService(client, {
      createSessionId: () => "session_12345678"
    });

    const result = await service.chat({
      message: "Muéstrame la propiedad"
    });

    expect(result.data.payloads).toEqual([
      {
        type: "text",
        text: "Aquí tienes"
      },
      {
        type: "media",
        url: "https://cdn.example.com/property.jpg"
      },
      {
        type: "media",
        url: "http://media.example.org/floor-plan.pdf"
      }
    ]);
  });

  it("removes file, localhost and private-network media URLs", async () => {
    const client = createClient({
      message: "Contenido seguro",
      payloads: [
        {
          type: "text",
          text: "Contenido seguro"
        },
        {
          type: "media",
          url: "file:///Users/inma/private.pdf"
        },
        {
          type: "media",
          url: "http://localhost:8787/private"
        },
        {
          type: "media",
          url: "http://127.0.0.1/private"
        },
        {
          type: "media",
          url: "http://0.0.0.0/private"
        },
        {
          type: "media",
          url: "http://10.0.0.8/private"
        },
        {
          type: "media",
          url: "http://172.16.2.4/private"
        },
        {
          type: "media",
          url: "http://192.168.1.20/private"
        },
        {
          type: "media",
          url: "https://cdn.example.com/public.jpg"
        }
      ]
    });

    const service = new PublicChatService(client, {
      createSessionId: () => "session_12345678"
    });

    const result = await service.chat({
      message: "Muéstrame contenido"
    });

    expect(result.data.payloads).toEqual([
      {
        type: "text",
        text: "Contenido seguro"
      },
      {
        type: "media",
        url: "https://cdn.example.com/public.jpg"
      }
    ]);

    expect(JSON.stringify(result)).not.toContain(
      "/Users/inma"
    );
    expect(JSON.stringify(result)).not.toContain(
      "localhost"
    );
    expect(JSON.stringify(result)).not.toContain(
      "192.168"
    );
  });

  it("uses the client message when only media payloads exist", async () => {
    const client = createClient({
      message: "Te comparto el plano",
      payloads: [
        {
          type: "media",
          url: "https://cdn.example.com/plan.pdf"
        }
      ]
    });

    const service = new PublicChatService(client, {
      createSessionId: () => "session_12345678"
    });

    const result = await service.chat({
      message: "Quiero el plano"
    });

    expect(result.data.message).toBe(
      "Te comparto el plano"
    );
    expect(result.data.payloads).toEqual([
      {
        type: "media",
        url: "https://cdn.example.com/plan.pdf"
      }
    ]);
  });

  it("rejects internal request fields through the strict shared schema", async () => {
    const client = createClient({
      message: "unused",
      payloads: []
    });

    const service = new PublicChatService(client);

    await expect(
      service.chat({
        message: "Hola",
        sessionKey:
          "agent:real-estate-agent:web-secret"
      } as never)
    ).rejects.toMatchObject({
      name: "ZodError"
    });

    expect(client.sendMessage).not.toHaveBeenCalled();
  });

  it("rejects invalid public session IDs before calling OpenClaw", async () => {
    const client = createClient({
      message: "unused",
      payloads: []
    });

    const service = new PublicChatService(client);

    await expect(
      service.chat({
        sessionId:
          "agent:real-estate-agent:web-secret",
        message: "Hola"
      })
    ).rejects.toMatchObject({
      name: "ZodError"
    });

    expect(client.sendMessage).not.toHaveBeenCalled();
  });

  it("maps OpenClaw errors to a safe external service error", async () => {
    const client: PublicChatAgentClient = {
      sendMessage: vi.fn(async () => {
        throw new OpenClawAgentClientError(
          "OPENCLAW_PROCESS_FAILED",
          "token=secret workspace=/Users/inma/private"
        );
      })
    };

    const service = new PublicChatService(client, {
      createSessionId: () => "session_12345678"
    });

    try {
      await service.chat({
        message: "Hola"
      });

      throw new Error("Expected service to fail");
    } catch (error) {
      expect(error).toMatchObject({
        name: "ServiceException",
        code: "EXTERNAL_ERROR",
        message:
          "The chat agent is temporarily unavailable"
      });

      expect(String(error)).not.toContain("secret");
      expect(String(error)).not.toContain(
        "/Users/inma"
      );
    }
  });

  it("fails safely when all returned content is unusable", async () => {
    const client = createClient({
      message: "",
      payloads: [
        {
          type: "media",
          url: "file:///Users/inma/private.pdf"
        }
      ]
    });

    const service = new PublicChatService(client, {
      createSessionId: () => "session_12345678"
    });

    await expect(
      service.chat({
        message: "Hola"
      })
    ).rejects.toMatchObject({
      code: "EXTERNAL_ERROR",
      message:
        "The chat agent returned no public content"
    });
  });
});

describe("isSafePublicMediaUrl", () => {
  it.each([
    ["https://example.com/a.jpg", true],
    ["http://cdn.example.com/a.jpg", true],
    ["file:///tmp/private.pdf", false],
    ["ftp://example.com/private", false],
    ["http://localhost:8787/private", false],
    ["http://127.0.0.1/private", false],
    ["http://10.1.2.3/private", false],
    ["http://172.31.255.1/private", false],
    ["http://192.168.1.5/private", false],
    ["http://169.254.1.2/private", false],
    ["http://user:password@example.com/a", false],
    ["not-a-url", false]
  ])("classifies %s as %s", (url, expected) => {
    expect(isSafePublicMediaUrl(url)).toBe(expected);
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  OpenClawAgentClient,
  OpenClawAgentClientError,
  type OpenClawRunner
} from "../../src/integrations/openclaw/openclaw-agent.client";

function createRunner(
  result: Awaited<ReturnType<OpenClawRunner>>
): OpenClawRunner {
  return vi.fn(async () => result);
}

describe("OpenClawAgentClient", () => {
  it("constructs the session key internally and uses separated spawn arguments", async () => {
    const runner = createRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        status: "ok",
        result: {
          payloads: [
            {
              text: "Hola desde Carlos"
            }
          ]
        }
      }),
      stderr: "",
      timedOut: false
    });

    const client = new OpenClawAgentClient({
      runner,
      binary: "/usr/local/bin/openclaw",
      agentId: "real-estate-agent",
      timeoutMs: 120_000
    });

    const result = await client.sendMessage({
      sessionId: "web-session_12345678",
      message: "Busco una propiedad"
    });

    expect(result).toEqual({
      message: "Hola desde Carlos",
      payloads: [
        {
          type: "text",
          text: "Hola desde Carlos"
        }
      ]
    });

    expect(runner).toHaveBeenCalledWith({
      binary: "/usr/local/bin/openclaw",
      args: [
        "agent",
        "--agent",
        "real-estate-agent",
        "--session-key",
        "agent:real-estate-agent:web-web-session_12345678",
        "--message",
        "Busco una propiedad",
        "--json",
        "--timeout",
        "120"
      ],
      timeoutMs: 120_000,
      maxOutputBytes: 1_048_576
    });
  });

  it("normalizes multiple text and media payloads", async () => {
    const runner = createRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        status: "ok",
        result: {
          payloads: [
            {
              text: "Primera respuesta"
            },
            {
              mediaUrl: "https://cdn.example.com/property.jpg"
            },
            {
              text: "Segunda respuesta"
            }
          ],
          meta: {
            provider: "hidden-provider",
            usage: {
              tokens: 999
            }
          }
        }
      }),
      stderr: "",
      timedOut: false
    });

    const client = new OpenClawAgentClient({ runner });

    await expect(
      client.sendMessage({
        sessionId: "session_12345678",
        message: "Muéstrame opciones"
      })
    ).resolves.toEqual({
      message: "Primera respuesta\n\nSegunda respuesta",
      payloads: [
        {
          type: "text",
          text: "Primera respuesta"
        },
        {
          type: "media",
          url: "https://cdn.example.com/property.jpg"
        },
        {
          type: "text",
          text: "Segunda respuesta"
        }
      ]
    });
  });

  it("uses finalAssistantVisibleText when payload text is absent", async () => {
    const runner = createRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        status: "ok",
        result: {
          payloads: [],
          meta: {
            finalAssistantVisibleText: "Respuesta visible de fallback",
            model: "hidden-model"
          }
        }
      }),
      stderr: "",
      timedOut: false
    });

    const client = new OpenClawAgentClient({ runner });

    await expect(
      client.sendMessage({
        sessionId: "session_12345678",
        message: "Hola"
      })
    ).resolves.toEqual({
      message: "Respuesta visible de fallback",
      payloads: [
        {
          type: "text",
          text: "Respuesta visible de fallback"
        }
      ]
    });
  });

  it("rejects invalid JSON", async () => {
    const runner = createRunner({
      exitCode: 0,
      stdout: "not-json",
      stderr: "",
      timedOut: false
    });

    const client = new OpenClawAgentClient({ runner });

    await expect(
      client.sendMessage({
        sessionId: "session_12345678",
        message: "Hola"
      })
    ).rejects.toMatchObject({
      code: "OPENCLAW_INVALID_RESPONSE"
    });
  });

  it("rejects a non-ok OpenClaw status", async () => {
    const runner = createRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        status: "error",
        result: {
          payloads: []
        }
      }),
      stderr: "",
      timedOut: false
    });

    const client = new OpenClawAgentClient({ runner });

    await expect(
      client.sendMessage({
        sessionId: "session_12345678",
        message: "Hola"
      })
    ).rejects.toMatchObject({
      code: "OPENCLAW_INVALID_RESPONSE"
    });
  });

  it("maps timeouts to a safe client error", async () => {
    const runner = createRunner({
      exitCode: null,
      stdout: "",
      stderr: "",
      timedOut: true
    });

    const client = new OpenClawAgentClient({ runner });

    await expect(
      client.sendMessage({
        sessionId: "session_12345678",
        message: "Hola"
      })
    ).rejects.toEqual(
      expect.objectContaining({
        name: "OpenClawAgentClientError",
        code: "OPENCLAW_TIMEOUT",
        message: "The agent response timed out"
      })
    );
  });

  it("maps output limit failures to a safe client error", async () => {
    const runner = createRunner({
      exitCode: null,
      stdout: "",
      stderr: "__OPENCLAW_OUTPUT_LIMIT__",
      timedOut: false
    });

    const client = new OpenClawAgentClient({ runner });

    await expect(
      client.sendMessage({
        sessionId: "session_12345678",
        message: "Hola"
      })
    ).rejects.toMatchObject({
      code: "OPENCLAW_OUTPUT_LIMIT"
    });
  });

  it("does not expose stderr when the child process fails", async () => {
    const runner = createRunner({
      exitCode: 1,
      stdout: "",
      stderr:
        "token=secret workspaceDir=/Users/inma/private provider=private"
      ,
      timedOut: false
    });

    const client = new OpenClawAgentClient({ runner });

    try {
      await client.sendMessage({
        sessionId: "session_12345678",
        message: "Hola"
      });

      throw new Error("Expected client to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(OpenClawAgentClientError);
      expect(error).toMatchObject({
        code: "OPENCLAW_PROCESS_FAILED",
        message: "The agent process failed"
      });

      expect(String(error)).not.toContain("secret");
      expect(String(error)).not.toContain("/Users/inma");
      expect(String(error)).not.toContain("private");
    }
  });

  it("rejects a successful response without visible content", async () => {
    const runner = createRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        status: "ok",
        result: {
          payloads: [],
          meta: {}
        }
      }),
      stderr: "",
      timedOut: false
    });

    const client = new OpenClawAgentClient({ runner });

    await expect(
      client.sendMessage({
        sessionId: "session_12345678",
        message: "Hola"
      })
    ).rejects.toMatchObject({
      code: "OPENCLAW_EMPTY_RESPONSE"
    });
  });
});

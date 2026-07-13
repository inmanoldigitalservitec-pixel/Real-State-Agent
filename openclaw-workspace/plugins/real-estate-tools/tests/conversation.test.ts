import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createConversationClientMessageId,
  loadTrustedConversationContext,
  resolveTrustedConversation
} from "../src/conversation.js";

const config = {
  baseUrl: "http://127.0.0.1:8787",
  companyId: "99999999-9999-1999-8999-999999999999",
  channel: "web" as const
};

describe("conversation internals", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENCLAW_AGENT_CORE_API_KEY;
  });

  it("requires a trusted sessionKey", async () => {
    await expect(
      resolveTrustedConversation(config, {
        api: {
          logger: {},
          runContext: {
            agentId: "real-estate-agent"
          }
        } as never,
        toolCallId: "tool-1"
      })
    ).rejects.toThrow("sessionKey");
  });

  it("resolves a conversation from trusted runtime context without model-visible ids", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            conversationId: "88888888-8888-1888-8888-888888888888",
            companyId: "99999999-9999-1999-8999-999999999999",
            currentSalesStage: "NEW",
            memoryVersion: 1,
            created: true
          },
          metadata: {
            verifiedAt: new Date().toISOString()
          }
        }),
        { status: 201 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveTrustedConversation(config, {
      api: {
        logger: {},
        runContext: {
          agentId: "real-estate-agent",
          sessionKey: "agent:real-estate-agent:main",
          runId: "run-1",
          workspaceDir: "/tmp/workspace"
        }
      } as never,
      toolCallId: "tool-1"
    });

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);

    expect(result.conversationId).toBe("88888888-8888-1888-8888-888888888888");
    expect(body).toEqual({
      companyId: "99999999-9999-1999-8999-999999999999",
      channel: "web",
      externalSessionId: "agent:real-estate-agent:main",
      metadata: {
        runId: "run-1"
      }
    });
  });

  it("preserves the full sessionKey when agentId is derived from runtime sessionKey", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            conversationId: "88888888-8888-1888-8888-888888888888",
            companyId: "99999999-9999-1999-8999-999999999999",
            currentSalesStage: "NEW",
            memoryVersion: 1,
            created: true
          },
          metadata: {
            verifiedAt: new Date().toISOString()
          }
        }),
        { status: 201 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    await resolveTrustedConversation(config, {
      api: {
        logger: {},
        runContext: {
          sessionKey: "agent:real-estate-agent:derived-session",
          runId: "run-1"
        }
      } as never,
      toolCallId: "tool-1"
    });

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);

    expect(body.externalSessionId).toBe("agent:real-estate-agent:derived-session");
  });

  it("creates deterministic clientMessageIds", () => {
    const first = createConversationClientMessageId({
      sessionKey: "agent:real-estate-agent:main",
      runId: "run-1",
      role: "user"
    });
    const second = createConversationClientMessageId({
      sessionKey: "agent:real-estate-agent:main",
      runId: "run-1",
      role: "user"
    });
    const assistant = createConversationClientMessageId({
      sessionKey: "agent:real-estate-agent:main",
      runId: "run-1",
      role: "assistant"
    });

    expect(first).toBe(second);
    expect(first).not.toBe(assistant);
    expect(first).toMatch(/^ocmsg_/);
  });

  it("loads trusted conversation context", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            conversationId: "88888888-8888-1888-8888-888888888888",
            currentSalesStage: "NEW",
            memory: null,
            messages: []
          },
          metadata: {
            verifiedAt: new Date().toISOString()
          }
        }),
        { status: 200 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const context = await loadTrustedConversationContext({
      rawConfig: config,
      conversationId: "88888888-8888-1888-8888-888888888888",
      messageLimit: 3,
      context: {
        api: {
          logger: {},
          runContext: {
            agentId: "real-estate-agent"
          }
        } as never,
        toolCallId: "tool-1"
      }
    });

    expect(context.conversationId).toBe("88888888-8888-1888-8888-888888888888");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("messageLimit=3");
  });
});

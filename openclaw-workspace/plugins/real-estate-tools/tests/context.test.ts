import { describe, expect, it } from "vitest";
import { buildTrustedToolContext, parseAgentIdFromSessionKey } from "../src/context.js";

describe("trusted tool context", () => {
  it("parses a valid agent sessionKey", () => {
    expect(parseAgentIdFromSessionKey("agent:real-estate-agent:carlos-123")).toBe("real-estate-agent");
    expect(parseAgentIdFromSessionKey("agent:main:default")).toBe("main");
  });

  it("rejects invalid sessionKey formats", () => {
    expect(parseAgentIdFromSessionKey("real-estate-agent:carlos")).toBeUndefined();
    expect(parseAgentIdFromSessionKey("agent::session")).toBeUndefined();
    expect(parseAgentIdFromSessionKey("agent:real-estate-agent:")).toBeUndefined();
    expect(parseAgentIdFromSessionKey("foo:agent:real-estate-agent:test")).toBeUndefined();
    expect(parseAgentIdFromSessionKey("agent:real-estate-agent:test session")).toBeUndefined();
  });

  it("uses the explicit runtime agentId when present", () => {
    const trustedContext = buildTrustedToolContext({
      api: {
        runContext: {
          agentId: "real-estate-agent",
          sessionKey: "agent:real-estate-agent:test-session"
        }
      } as never,
      toolCallId: "tool-1"
    });

    expect(trustedContext.agentId).toBe("real-estate-agent");
    expect(trustedContext.agentIdSource).toBe("explicit");
  });

  it("derives agentId from sessionKey when explicit agentId is absent", () => {
    const trustedContext = buildTrustedToolContext({
      api: {
        runContext: {
          sessionKey: "agent:real-estate-agent:test-session"
        }
      } as never,
      toolCallId: "tool-1"
    });

    expect(trustedContext.agentId).toBe("real-estate-agent");
    expect(trustedContext.agentIdSource).toBe("sessionKey");
  });

  it("accepts matching explicit and derived agentIds", () => {
    const trustedContext = buildTrustedToolContext({
      api: {
        runContext: {
          agentId: "real-estate-agent",
          sessionKey: "agent:real-estate-agent:test-session"
        }
      } as never,
      toolCallId: "tool-1"
    });

    expect(trustedContext.agentId).toBe("real-estate-agent");
    expect(trustedContext.agentIdSource).toBe("explicit");
  });

  it("rejects inconsistent explicit and derived agentIds", () => {
    expect(() =>
      buildTrustedToolContext({
        api: {
          runContext: {
            agentId: "main",
            sessionKey: "agent:real-estate-agent:test-session"
          }
        } as never,
        toolCallId: "tool-1"
      })
    ).toThrow("inconsistent trusted agent context");
  });

  it("keeps agentId unavailable when sessionKey is invalid", () => {
    const trustedContext = buildTrustedToolContext({
      api: {
        runContext: {
          sessionKey: "agent:real-estate-agent:"
        }
      } as never,
      toolCallId: "tool-1"
    });

    expect(trustedContext.agentId).toBeUndefined();
    expect(trustedContext.agentIdSource).toBe("unavailable");
    expect(trustedContext.sessionKey).toBe("agent:real-estate-agent:");
  });

  it("keeps agentId unavailable when no trusted runtime agent context exists", () => {
    const trustedContext = buildTrustedToolContext({
      api: {} as never,
      toolCallId: "tool-1"
    });

    expect(trustedContext.agentId).toBeUndefined();
    expect(trustedContext.agentIdSource).toBe("unavailable");
    expect(trustedContext.sessionKey).toBeUndefined();
  });
});

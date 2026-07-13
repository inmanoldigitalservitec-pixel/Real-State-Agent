import { describe, expect, it, vi } from "vitest";
import { executeAgentCoreHealth } from "../src/tools/agent-core-health.js";

describe("executeAgentCoreHealth", () => {
  it("returns sanitized diagnostic payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "ok",
            service: "agent-core",
            timestamp: new Date().toISOString(),
            version: "0.1.0"
          }),
          { status: 200 }
        )
      )
    );

    const result = await executeAgentCoreHealth(
      {},
      {
        baseUrl: "http://127.0.0.1:8787"
      },
      {
        api: {
          logger: {},
          runContext: {
            sessionKey: "agent:real-estate-agent:health-check"
          }
        } as never,
        toolCallId: "tool-1",
        signal: new AbortController().signal
      }
    );

    expect(result.ok).toBe(true);
    expect(result.service).toBe("agent-core");
    expect(result.correlationId).toContain("agent_core_health");
  });
});

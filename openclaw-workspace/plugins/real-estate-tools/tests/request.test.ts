import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../src/client/request.js";
import { createLogger } from "../src/telemetry/logger.js";
import type { ResolvedAgentCorePluginConfig } from "../src/types.js";
import { AgentCoreClientError } from "../src/client/errors.js";

const config: ResolvedAgentCorePluginConfig = {
  baseUrl: "http://127.0.0.1:8787",
  internalApiKeyEnvVar: "OPENCLAW_AGENT_CORE_API_KEY",
  channel: "web",
  timeoutMs: 1000,
  logLevel: "debug"
};

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENCLAW_AGENT_CORE_API_KEY;
  });

  it("sends correlation headers and parses JSON", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestJson(config, createLogger({}), {
      path: "/internal/test",
      method: "GET",
      correlationId: "corr-1"
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: "Bearer secret",
        "X-Correlation-Id": "corr-1"
      })
    });
    expect(result.body).toEqual({ status: "ok" });
  });

  it("fails when auth is required and env var is missing", async () => {
    vi.stubGlobal("fetch", vi.fn());

    await expect(
      requestJson(config, createLogger({}), {
        path: "/internal/test",
        correlationId: "corr-2"
      })
    ).rejects.toBeInstanceOf(AgentCoreClientError);
  });
});

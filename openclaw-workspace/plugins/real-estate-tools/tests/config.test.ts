import { describe, expect, it } from "vitest";
import { resolvePluginConfig } from "../src/config.js";

describe("resolvePluginConfig", () => {
  it("uses defaults", () => {
    const config = resolvePluginConfig({});

    expect(config.baseUrl).toBe("http://127.0.0.1:8787");
    expect(config.internalApiKeyEnvVar).toBe("OPENCLAW_AGENT_CORE_API_KEY");
    expect(config.companyId).toBeUndefined();
    expect(config.channel).toBe("web");
    expect(config.timeoutMs).toBe(10_000);
    expect(config.logLevel).toBe("info");
  });

  it("accepts private company and channel config", () => {
    const config = resolvePluginConfig({
      companyId: "00000000-0000-0000-0000-000000000001",
      channel: "web"
    });

    expect(config.companyId).toBe("00000000-0000-0000-0000-000000000001");
    expect(config.channel).toBe("web");
  });

  it("rejects invalid company and channel config", () => {
    expect(() => resolvePluginConfig({ companyId: "not-a-uuid" })).toThrow("Invalid companyId");
    expect(() => resolvePluginConfig({ channel: "web_chat" as never })).toThrow("Invalid channel");
  });

  it("rejects invalid env var names", () => {
    expect(() => resolvePluginConfig({ internalApiKeyEnvVar: "bad-name" })).toThrow(
      "Invalid internalApiKeyEnvVar"
    );
  });
});

import { describe, expect, it } from "vitest";
import { parseApiFailureEnvelope, parseApiSuccessEnvelope, parseHealthPayload } from "../src/client/envelope.js";

describe("envelope parsing", () => {
  it("parses health payloads", () => {
    const result = parseHealthPayload({
      status: "ok",
      service: "agent-core",
      timestamp: new Date().toISOString(),
      version: "0.1.0"
    });

    expect(result.success).toBe(true);
  });

  it("parses success envelopes", () => {
    const result = parseApiSuccessEnvelope(
      (value): value is { value: string } =>
        typeof value === "object" && value !== null && typeof (value as { value?: unknown }).value === "string",
      {
        success: true,
        data: {
          value: "ok"
        },
        metadata: {
          verifiedAt: new Date().toISOString()
        }
      }
    );

    expect(result.success).toBe(true);
  });

  it("parses failure envelopes", () => {
    const result = parseApiFailureEnvelope({
      success: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "boom",
        retryable: true,
        requiresClarification: false,
        requiresHuman: false
      }
    });

    expect(result.success).toBe(true);
  });
});

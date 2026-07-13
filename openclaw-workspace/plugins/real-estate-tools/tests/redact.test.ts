import { describe, expect, it } from "vitest";
import { redactSecrets } from "../src/telemetry/redact.js";

describe("redactSecrets", () => {
  it("redacts sensitive keys and bearer tokens", () => {
    expect(
      redactSecrets({
        authorization: "Bearer abc123",
        nested: {
          apiKey: "secret"
        }
      })
    ).toEqual({
      authorization: "[REDACTED]",
      nested: {
        apiKey: "[REDACTED]"
      }
    });

    expect(redactSecrets("Bearer abc123")).toBe("Bearer [REDACTED]");
  });
});

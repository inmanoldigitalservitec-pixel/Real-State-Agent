import { describe, expect, it } from "vitest";
import { createCorrelationId } from "../src/telemetry/correlation.js";

describe("createCorrelationId", () => {
  it("includes sanitized tool and agent segments", () => {
    const correlationId = createCorrelationId("agent_core_health", "real-estate-agent");

    expect(correlationId).toMatch(/^oc_agent_core_health_real_estate_agent_/);
  });
});

import { randomUUID } from "node:crypto";

export function createCorrelationId(toolName: string, agentId?: string) {
  const toolSegment = sanitize(toolName);
  const agentSegment = sanitize(agentId ?? "unknown");
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = randomUUID().replace(/-/g, "").slice(0, 12);

  return `oc_${toolSegment}_${agentSegment}_${timestamp}_${random}`;
}

function sanitize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
}

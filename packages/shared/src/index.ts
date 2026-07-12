export const salesStages = [
  "NEW",
  "INQUIRY",
  "DISCOVERY",
  "RECOMMENDATION",
  "PROPERTY_INTEREST",
  "EVALUATION",
  "HIGH_INTENT",
  "VISIT_REQUESTED",
  "HUMAN_HANDOFF",
  "CLOSED"
] as const;

export type SalesStage = (typeof salesStages)[number];

export interface HealthPayload {
  status: "ok";
  service: "agent-core" | "web-chat" | "shared";
  timestamp: string;
  version: string;
}

export const appMetadata = {
  name: "Real State Agent",
  version: "0.1.0",
  agentCorePort: 8787,
  webChatPort: 5173
} as const;

export const projectLayout = [
  "apps/agent-core",
  "apps/web-chat",
  "packages/shared",
  "openclaw-workspace",
  "supabase"
] as const;

export function createHealthPayload(service: HealthPayload["service"]): HealthPayload {
  return {
    status: "ok",
    service,
    timestamp: new Date().toISOString(),
    version: appMetadata.version
  };
}

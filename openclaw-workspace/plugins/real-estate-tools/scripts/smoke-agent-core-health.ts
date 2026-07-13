import { resolvePluginConfig } from "../src/config.js";
import { AgentCoreClient } from "../src/client/agent-core-client.js";
import { createCorrelationId } from "../src/telemetry/correlation.js";
import { createLogger } from "../src/telemetry/logger.js";

const logger = createLogger({
  info(message: string, payload?: unknown) {
    console.log(message, JSON.stringify(payload ?? {}));
  },
  warn(message: string, payload?: unknown) {
    console.warn(message, JSON.stringify(payload ?? {}));
  },
  error(message: string, payload?: unknown) {
    console.error(message, JSON.stringify(payload ?? {}));
  }
});

async function main() {
  const config = resolvePluginConfig({
    baseUrl: process.env.OPENCLAW_AGENT_CORE_BASE_URL,
    internalApiKeyEnvVar: "OPENCLAW_AGENT_CORE_API_KEY"
  });
  const client = new AgentCoreClient(config, logger);
  const correlationId = createCorrelationId("agent_core_health_smoke", "real-estate-agent");
  const health = await client.getHealth({ correlationId });

  console.log(
    JSON.stringify(
      {
        ok: true,
        correlationId,
        status: health.status,
        service: health.service,
        version: health.version,
        timestamp: health.timestamp
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});

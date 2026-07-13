import { serve } from "@hono/node-server";
import { appMetadata } from "@real-estate-agent/shared";
import { loadMonorepoEnv } from "./config/load-env";
import { createApp } from "./app";

loadMonorepoEnv(import.meta.url);

const app = createApp();
const port = Number(process.env.AGENT_CORE_PORT ?? appMetadata.agentCorePort);

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`agent-core listening on http://localhost:${info.port}`);
  }
);

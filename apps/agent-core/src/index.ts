import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  appMetadata,
  createHealthPayload,
  projectLayout,
  salesStages
} from "@real-estate-agent/shared";
import { loadMonorepoEnv } from "./config/load-env";

const envPath = loadMonorepoEnv(import.meta.url);

const app = new Hono();

app.get("/", (context) => {
  return context.json({
    message: "Agent Core scaffold is running.",
    service: "agent-core"
  });
});

app.get("/health", (context) => {
  return context.json(createHealthPayload("agent-core"));
});

app.get("/api/v1/meta", (context) => {
  return context.json({
    app: appMetadata,
    salesStages,
    projectLayout,
    envPath
  });
});

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

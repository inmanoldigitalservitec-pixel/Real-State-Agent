import { Hono } from "hono";
import { leadCaptureInputSchema, leadResponseSchema } from "@real-estate-agent/shared";
import type { AppServices } from "../../app";
import { jsonSuccess, parseJsonBody } from "./helpers";

export function buildLeadRoutes(services: AppServices) {
  const routes = new Hono();

  routes.post("/", async (context) => {
    const body = await parseJsonBody(context, leadCaptureInputSchema);
    const result = await services.leadService.captureLead(body);

    return jsonSuccess(context, leadResponseSchema, result, 201);
  });

  return routes;
}

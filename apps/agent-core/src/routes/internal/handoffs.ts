import { Hono } from "hono";
import { humanHandoffInputSchema, humanHandoffResponseSchema } from "@real-estate-agent/shared";
import type { AppServices } from "../../app";
import { jsonSuccess, parseJsonBody } from "./helpers";

export function buildHandoffRoutes(services: AppServices) {
  const routes = new Hono();

  routes.post("/", async (context) => {
    const body = await parseJsonBody(context, humanHandoffInputSchema);
    const result = await services.humanHandoffService.requestHumanHandoff(body);

    return jsonSuccess(context, humanHandoffResponseSchema, result, 201);
  });

  return routes;
}

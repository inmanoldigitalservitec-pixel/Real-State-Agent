import { Hono } from "hono";
import { visitRequestInputSchema, visitResponseSchema } from "@real-estate-agent/shared";
import type { AppServices } from "../../app";
import { jsonSuccess, parseJsonBody } from "./helpers";

export function buildVisitRoutes(services: AppServices) {
  const routes = new Hono();

  routes.post("/", async (context) => {
    const body = await parseJsonBody(context, visitRequestInputSchema);
    const result = await services.visitService.requestVisit(body);

    return jsonSuccess(context, visitResponseSchema, result, 201);
  });

  return routes;
}

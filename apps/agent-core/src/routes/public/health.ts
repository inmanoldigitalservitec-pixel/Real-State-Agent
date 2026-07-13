import { Hono } from "hono";
import { publicHealthResponseSchema } from "@real-estate-agent/shared";

export function buildPublicHealthRoutes() {
  const routes = new Hono();

  routes.get("/", (context) => {
    const response = publicHealthResponseSchema.parse({
      success: true,
      data: {
        status: "ok"
      }
    });

    return context.json(response);
  });

  return routes;
}

import { Hono } from "hono";
import type { PublicChatRouteService } from "./chat";
import { buildPublicChatRoutes } from "./chat";
import { buildPublicHealthRoutes } from "./health";

export function buildPublicRoutes(
  publicChatService: PublicChatRouteService
) {
  const routes = new Hono();

  routes.route("/health", buildPublicHealthRoutes());
  routes.route("/chat", buildPublicChatRoutes(publicChatService));

  return routes;
}

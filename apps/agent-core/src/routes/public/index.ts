import { Hono } from "hono";
import type {
  PublicChatSecurityConfig
} from "../../config/public-chat-config";
import type {
  PublicChatRouteService
} from "./chat";
import { buildPublicChatRoutes } from "./chat";
import { buildPublicHealthRoutes } from "./health";

export function buildPublicRoutes(
  publicChatService: PublicChatRouteService,
  config: PublicChatSecurityConfig
) {
  const routes = new Hono();

  routes.route(
    "/health",
    buildPublicHealthRoutes()
  );
  routes.route(
    "/chat",
    buildPublicChatRoutes(
      publicChatService,
      config.maxBodyBytes
    )
  );

  return routes;
}

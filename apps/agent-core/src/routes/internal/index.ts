import { Hono } from "hono";
import type { AppServices } from "../../app";
import { buildCompanyRoutes } from "./companies";
import { buildConversationRoutes } from "./conversations";
import { buildHandoffRoutes } from "./handoffs";
import { buildLeadRoutes } from "./leads";
import { buildPropertyRoutes } from "./properties";
import { buildVisitRoutes } from "./visits";

export function buildInternalRoutes(services: AppServices) {
  const routes = new Hono();

  routes.route("/properties", buildPropertyRoutes(services));
  routes.route("/companies", buildCompanyRoutes(services));
  routes.route("/conversations", buildConversationRoutes(services));
  routes.route("/leads", buildLeadRoutes(services));
  routes.route("/visits", buildVisitRoutes(services));
  routes.route("/handoffs", buildHandoffRoutes(services));

  return routes;
}

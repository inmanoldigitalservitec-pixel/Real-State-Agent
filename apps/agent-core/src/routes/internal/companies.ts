import { Hono } from "hono";
import { companyInformationResultSchema, getCompanyInformationInputSchema } from "@real-estate-agent/shared";
import type { AppServices } from "../../app";
import { jsonSuccess, parseParams } from "./helpers";

export function buildCompanyRoutes(services: AppServices) {
  const routes = new Hono();

  routes.get("/:companyId/information", async (context) => {
    const { companyId } = parseParams(context, getCompanyInformationInputSchema);
    const result = await services.companyInformationService.getCompanyInformation(companyId);

    return jsonSuccess(context, companyInformationResultSchema, result);
  });

  return routes;
}

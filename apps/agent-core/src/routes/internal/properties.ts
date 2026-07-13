import { Hono } from "hono";
import {
  checkPropertyAvailabilityInputSchema,
  getPaymentPlanInputSchema,
  getPropertyDetailsInputSchema,
  getPropertyMediaInputSchema,
  paymentPlanResultSchema,
  propertyAvailabilityResultSchema,
  propertyDetailsSchema,
  propertyDocumentsInputSchema,
  propertyIdPathParamsSchema,
  propertyReferenceResolutionSchema,
  propertySearchInputSchema,
  propertySearchResultSchema,
  publicPropertyDocumentSchema,
  publicPropertyMediaItemSchema,
  resolvePropertyReferenceInputSchema
} from "@real-estate-agent/shared";
import type { AppServices } from "../../app";
import { parseJsonBody, parseParams, parseQuery, jsonSuccess } from "./helpers";
import { presentPropertyDocument, presentPropertyMediaItem } from "./presenters";

const propertyMediaRequestBodySchema = getPropertyMediaInputSchema.omit({ propertyId: true });
const propertyDocumentsRequestBodySchema = propertyDocumentsInputSchema.omit({ propertyId: true, developmentId: true });
const paymentPlanQuerySchema = getPaymentPlanInputSchema.omit({ propertyId: true });

export function buildPropertyRoutes(services: AppServices) {
  const routes = new Hono();

  routes.post("/resolve-reference", async (context) => {
    const input = await parseJsonBody(context, resolvePropertyReferenceInputSchema);
    const result = await services.propertyReferenceService.resolveReference(input);

    return jsonSuccess(context, propertyReferenceResolutionSchema, result);
  });

  routes.post("/search", async (context) => {
    const input = await parseJsonBody(context, propertySearchInputSchema);
    const result = await services.propertySearchService.search(input);

    return jsonSuccess(context, propertySearchResultSchema.array(), result);
  });

  routes.get("/:propertyId", async (context) => {
    const { propertyId } = parseParams(context, getPropertyDetailsInputSchema);
    const result = await services.propertyDetailsService.getPropertyDetails(propertyId);

    return jsonSuccess(context, propertyDetailsSchema, result);
  });

  routes.get("/:propertyId/availability", async (context) => {
    const { propertyId } = parseParams(context, checkPropertyAvailabilityInputSchema);
    const result = await services.propertyAvailabilityService.checkPropertyAvailability(propertyId);

    return jsonSuccess(context, propertyAvailabilityResultSchema, result);
  });

  routes.post("/:propertyId/media", async (context) => {
    const { propertyId } = parseParams(context, propertyIdPathParamsSchema);
    const body = await parseJsonBody(context, propertyMediaRequestBodySchema);
    const result = await services.propertyMediaService.getPropertyMedia({
      propertyId,
      unitId: body.unitId,
      categories: body.categories,
      limit: body.limit
    });

    return jsonSuccess(context, publicPropertyMediaItemSchema.array(), result.map(presentPropertyMediaItem));
  });

  routes.post("/:propertyId/documents", async (context) => {
    const { propertyId } = parseParams(context, propertyIdPathParamsSchema);
    const body = await parseJsonBody(context, propertyDocumentsRequestBodySchema);
    const result = await services.propertyDocumentsService.getPropertyDocuments({
      propertyId,
      unitId: body.unitId,
      categories: body.categories
    });

    return jsonSuccess(context, publicPropertyDocumentSchema.array(), result.map(presentPropertyDocument));
  });

  routes.get("/:propertyId/payment-plan", async (context) => {
    const { propertyId } = parseParams(context, propertyIdPathParamsSchema);
    const query = parseQuery(context, paymentPlanQuerySchema);
    const result = await services.paymentPlanService.getPaymentPlan({
      propertyId,
      unitId: query.unitId
    });

    return jsonSuccess(context, paymentPlanResultSchema, result);
  });

  return routes;
}

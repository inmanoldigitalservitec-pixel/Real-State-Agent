import { Hono } from "hono";
import {
  conversationContextResultSchema,
  conversationIdPathParamsSchema,
  conversationStatePatchSchema,
  getConversationContextInputSchema,
  messageResponseSchema,
  resolveConversationInputSchema,
  resolveConversationResultSchema,
  saveMessageInputSchema,
  conversationMemorySchema
} from "@real-estate-agent/shared";
import type { AppServices } from "../../app";
import { jsonSuccess, parseJsonBody, parseParams, parseQuery } from "./helpers";

const conversationContextQuerySchema = getConversationContextInputSchema.omit({ conversationId: true });
const saveMessageBodySchema = saveMessageInputSchema.omit({ conversationId: true });

export function buildConversationRoutes(services: AppServices) {
  const routes = new Hono();

  routes.post("/resolve", async (context) => {
    const body = await parseJsonBody(context, resolveConversationInputSchema);
    const result = await services.conversationService.resolveOrCreateConversation(body);

    return jsonSuccess(context, resolveConversationResultSchema, result, result.created ? 201 : 200);
  });

  routes.get("/:conversationId/context", async (context) => {
    const { conversationId } = parseParams(context, conversationIdPathParamsSchema);
    const query = parseQuery(context, conversationContextQuerySchema);
    const result = await services.conversationService.getConversationContext(conversationId, query.messageLimit);

    return jsonSuccess(context, conversationContextResultSchema, result);
  });

  routes.patch("/:conversationId/state", async (context) => {
    const { conversationId } = parseParams(context, conversationIdPathParamsSchema);
    const body = await parseJsonBody(context, conversationStatePatchSchema);
    const result = await services.conversationService.updateConversationState(conversationId, body);

    return jsonSuccess(context, conversationMemorySchema, result);
  });

  routes.post("/:conversationId/messages", async (context) => {
    const { conversationId } = parseParams(context, conversationIdPathParamsSchema);
    const body = await parseJsonBody(context, saveMessageBodySchema);
    const result = await services.conversationService.saveMessage({
      ...body,
      conversationId
    });

    return jsonSuccess(context, messageResponseSchema, result, 201);
  });

  return routes;
}

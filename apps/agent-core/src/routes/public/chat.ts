import { Hono } from "hono";
import {
  publicChatRequestSchema,
  publicChatResponseSchema
} from "@real-estate-agent/shared";
import type { PublicChatService } from "../../services/public-chat.service";
import { HttpError } from "../../middleware/error-handler";

export type PublicChatRouteService = Pick<
  PublicChatService,
  "chat"
>;

async function parsePublicChatBody(context: {
  req: {
    json(): Promise<unknown>;
  };
}) {
  let body: unknown;

  try {
    body = await context.req.json();
  } catch {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid JSON body",
      false,
      true
    );
  }

  return publicChatRequestSchema.parse(body);
}

export function buildPublicChatRoutes(
  publicChatService: PublicChatRouteService
) {
  const routes = new Hono();

  routes.post("/", async (context) => {
    const request = await parsePublicChatBody(context);
    const response = await publicChatService.chat(request);
    const validated = publicChatResponseSchema.parse(response);

    return context.json(validated);
  });

  return routes;
}

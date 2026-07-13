import { Buffer } from "node:buffer";
import { Hono } from "hono";
import {
  publicChatRequestSchema,
  publicChatResponseSchema
} from "@real-estate-agent/shared";
import type {
  PublicChatService
} from "../../services/public-chat.service";
import { HttpError } from "../../middleware/error-handler";

export type PublicChatRouteService = Pick<
  PublicChatService,
  "chat"
>;

async function parsePublicChatBody(
  context: {
    req: {
      text(): Promise<string>;
    };
  },
  maxBodyBytes: number
) {
  const rawBody = await context.req.text();

  if (
    Buffer.byteLength(rawBody, "utf8") >
    maxBodyBytes
  ) {
    throw new HttpError(
      413,
      "VALIDATION_ERROR",
      "Request body too large",
      false,
      true
    );
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
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
  publicChatService: PublicChatRouteService,
  maxBodyBytes: number
) {
  const routes = new Hono();

  routes.post("/", async (context) => {
    const request = await parsePublicChatBody(
      context,
      maxBodyBytes
    );
    const response =
      await publicChatService.chat(request);
    const validated =
      publicChatResponseSchema.parse(response);

    return context.json(validated);
  });

  return routes;
}

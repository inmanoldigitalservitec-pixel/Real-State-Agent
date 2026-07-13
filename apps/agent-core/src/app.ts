import { Hono, type MiddlewareHandler } from "hono";
import { createHealthPayload } from "@real-estate-agent/shared";
import { createAgentCoreServices } from "./services";
import { installErrorHandler, HttpError } from "./middleware/error-handler";
import { internalAuthMiddleware } from "./middleware/internal-auth";
import { buildInternalRoutes } from "./routes/internal";
import { buildPublicRoutes } from "./routes/public";
import {
  OpenClawAgentClient
} from "./integrations/openclaw/openclaw-agent.client";
import {
  PublicChatService
} from "./services/public-chat.service";
import type {
  PublicChatRouteService
} from "./routes/public/chat";

export type AppServices = ReturnType<typeof createAgentCoreServices>["services"];

function timeoutMiddleware(timeoutMs: number) {
  const middleware: MiddlewareHandler = async (_context, next) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    await Promise.race([
      next(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new HttpError(504, "UNEXPECTED_ERROR", "Request timed out", true));
        }, timeoutMs);
      })
    ]).finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
  };

  return middleware;
}

function bodySizeLimitMiddleware(maxSizeBytes: number) {
  const middleware: MiddlewareHandler = async (context, next) => {
    const rawLength = context.req.header("content-length");
    const contentLength = rawLength ? Number(rawLength) : 0;

    if (Number.isFinite(contentLength) && contentLength > maxSizeBytes) {
      throw new HttpError(413, "VALIDATION_ERROR", "Request body too large", false, true);
    }

    await next();
  };

  return middleware;
}

export function createApp(
  services: AppServices = createAgentCoreServices().services,
  publicChatService: PublicChatRouteService = new PublicChatService(
    new OpenClawAgentClient()
  )
) {
  const app = new Hono();

  installErrorHandler(app);

  app.get("/health", (context) => {
    return context.json(createHealthPayload("agent-core"));
  });

  app.route("/public", buildPublicRoutes(publicChatService));

  app.use("/internal/*", bodySizeLimitMiddleware(32 * 1024));
  app.use("/internal/*", timeoutMiddleware(10_000));
  app.use("/internal/*", internalAuthMiddleware);
  app.route("/internal", buildInternalRoutes(services));

  return app;
}

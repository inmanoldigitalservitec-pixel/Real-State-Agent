import type { MiddlewareHandler } from "hono";
import { HttpError } from "./error-handler";

export const internalAuthMiddleware: MiddlewareHandler = async (context, next) => {
  const expectedApiKey = process.env.AGENT_INTERNAL_API_KEY?.trim();

  if (!expectedApiKey) {
    throw new HttpError(500, "CONFIGURATION_ERROR", "Missing internal API key configuration");
  }

  const authorization = context.req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing bearer token");
  }

  const providedApiKey = authorization.slice("Bearer ".length).trim();

  if (!providedApiKey || providedApiKey !== expectedApiKey) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid bearer token");
  }

  await next();
};

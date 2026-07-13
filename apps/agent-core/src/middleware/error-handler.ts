import type { Hono } from "hono";
import { ZodError } from "zod";
import { apiFailureSchema, type ApiFailure, type ServiceError } from "@real-estate-agent/shared";
import { ServiceException } from "../lib/errors/service-error";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryable = false,
    public readonly requiresClarification = false,
    public readonly requiresHuman = false
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function buildFailure(error: {
  code: string;
  message: string;
  retryable: boolean;
  requiresClarification: boolean;
  requiresHuman: boolean;
}): ApiFailure {
  return apiFailureSchema.parse({
    success: false,
    error
  });
}

export function mapServiceErrorToStatus(code: string): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "VALIDATION_ERROR":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "DATABASE_ERROR":
      return 500;
    default:
      return 500;
  }
}

export function toApiFailure(error: unknown): { status: number; body: ApiFailure } {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: buildFailure({
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        requiresClarification: error.requiresClarification,
        requiresHuman: error.requiresHuman
      })
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: buildFailure({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        retryable: false,
        requiresClarification: true,
        requiresHuman: false
      })
    };
  }

  if (error instanceof ServiceException) {
    const code = error.code as ServiceError["code"];

    return {
      status: mapServiceErrorToStatus(code),
      body: buildFailure({
        code,
        message: error.message,
        retryable: code === "DATABASE_ERROR" || code === "EXTERNAL_ERROR",
        requiresClarification: code === "VALIDATION_ERROR",
        requiresHuman: false
      })
    };
  }

  return {
    status: 500,
    body: buildFailure({
      code: "UNEXPECTED_ERROR",
      message: "Unexpected internal error",
      retryable: false,
      requiresClarification: false,
      requiresHuman: false
    })
  };
}

export function installErrorHandler(app: Hono) {
  app.onError((error, context) => {
    const failure = toApiFailure(error);

    return context.json(failure.body, failure.status as 400 | 401 | 404 | 409 | 413 | 500 | 504);
  });
}

import { serviceErrorSchema, type ServiceError } from "@real-estate-agent/shared";

export class ServiceException extends Error {
  public readonly code: ServiceError["code"];
  public readonly details?: Record<string, unknown>;

  constructor(code: ServiceError["code"], message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, { cause });
    this.name = "ServiceException";
    this.code = code;
    this.details = details;
  }

  toJSON(): ServiceError {
    return serviceErrorSchema.parse({
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.cause instanceof Error ? this.cause.message : undefined
    });
  }
}

export function assertData<T>(value: T | null, code: ServiceError["code"], message: string): T {
  if (value === null) {
    throw new ServiceException(code, message);
  }

  return value;
}

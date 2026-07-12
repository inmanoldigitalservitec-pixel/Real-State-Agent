import { ServiceException } from "./errors/service-error";

export function unwrapSupabase<T>(result: { data: T | null; error: { message: string; code?: string } | null }, message: string): T {
  if (result.error) {
    throw new ServiceException("DATABASE_ERROR", message, {
      code: result.error.code,
      error: result.error.message
    });
  }

  if (result.data === null) {
    throw new ServiceException("NOT_FOUND", message);
  }

  return result.data;
}

export function unwrapSupabaseList<T>(result: { data: T[] | null; error: { message: string; code?: string } | null }, message: string): T[] {
  if (result.error) {
    throw new ServiceException("DATABASE_ERROR", message, {
      code: result.error.code,
      error: result.error.message
    });
  }

  return result.data ?? [];
}

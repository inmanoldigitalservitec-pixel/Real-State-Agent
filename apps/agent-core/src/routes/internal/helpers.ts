import { z, type ZodTypeAny } from "zod";
import type { Context } from "hono";
import { createApiSuccessSchema } from "@real-estate-agent/shared";
import { HttpError } from "../../middleware/error-handler";

export async function parseJsonBody<T extends ZodTypeAny>(context: Context, schema: T): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await context.req.json();
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid JSON body", false, true);
  }

  return schema.parse(body);
}

export function parseParams<T extends ZodTypeAny>(context: Context, schema: T): z.infer<T> {
  return schema.parse(context.req.param());
}

export function parseQuery<T extends ZodTypeAny>(context: Context, schema: T): z.infer<T> {
  return schema.parse(context.req.query());
}

export function jsonSuccess<T extends ZodTypeAny>(context: Context, schema: T, data: z.infer<T>, status = 200) {
  const payload = createApiSuccessSchema(schema).parse({
    success: true,
    data,
    metadata: {
      verifiedAt: new Date().toISOString()
    }
  });

  return context.json(payload, status as 200 | 201);
}

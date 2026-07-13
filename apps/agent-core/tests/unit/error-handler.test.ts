import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ServiceException } from "../../src/lib/errors/service-error";
import { toApiFailure } from "../../src/middleware/error-handler";

describe("error handler", () => {
  it("maps ZodError to VALIDATION_ERROR", () => {
    const result = z.object({ name: z.string() }).safeParse({});

    if (result.success) {
      throw new Error("Expected schema parsing to fail");
    }

    const failure = toApiFailure(result.error);

    expect(failure.status).toBe(400);
    expect(failure.body.error.code).toBe("VALIDATION_ERROR");
    expect(failure.body.error.requiresClarification).toBe(true);
  });

  it("maps ServiceException codes to HTTP status", () => {
    const failure = toApiFailure(new ServiceException("NOT_FOUND", "Missing"));

    expect(failure.status).toBe(404);
    expect(failure.body.error.code).toBe("NOT_FOUND");
  });
});

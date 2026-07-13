import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { internalAuthMiddleware } from "../../src/middleware/internal-auth";
import { installErrorHandler } from "../../src/middleware/error-handler";

describe("internalAuthMiddleware", () => {
  it("rejects missing bearer token", async () => {
    process.env.AGENT_INTERNAL_API_KEY = "test-key";
    const app = new Hono();
    installErrorHandler(app);
    app.use("/internal/*", internalAuthMiddleware);
    app.get("/internal/ping", (context) => context.json({ ok: true }));

    const response = await app.request("/internal/ping");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("allows the correct bearer token", async () => {
    process.env.AGENT_INTERNAL_API_KEY = "test-key";
    const app = new Hono();
    installErrorHandler(app);
    app.use("/internal/*", internalAuthMiddleware);
    app.get("/internal/ping", (context) => context.json({ ok: true }));

    const response = await app.request("/internal/ping", {
      headers: {
        Authorization: "Bearer test-key"
      }
    });

    expect(response.status).toBe(200);
  });
});

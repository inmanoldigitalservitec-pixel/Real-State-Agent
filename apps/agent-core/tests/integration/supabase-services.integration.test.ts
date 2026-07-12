import { beforeAll, describe, expect, it } from "vitest";
import { loadMonorepoEnv } from "../../src/config/load-env";
import { createAgentCoreServices } from "../../src/services";

loadMonorepoEnv(import.meta.url);

const hasSupabaseEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!hasSupabaseEnv)("Supabase services integration", () => {
  let services: ReturnType<typeof createAgentCoreServices>["services"];

  beforeAll(() => {
    services = createAgentCoreServices().services;
  });

  it("searches 3-bedroom properties by flexible location in Distrito Nacional", async () => {
    const results = await services.propertySearchService.search({
      location: "Distrito Nacional",
      bedrooms: 3,
      maximumPrice: 8000000,
      currency: "DOP"
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.propertyId === "00000000-0000-0000-0000-000000000203")).toBe(true);
  });

  it("searches strictly by city Santo Domingo", async () => {
    const results = await services.propertySearchService.search({
      city: "Santo Domingo",
      bedrooms: 3,
      maximumPrice: 8000000,
      currency: "DOP"
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.city === "Santo Domingo")).toBe(true);
    expect(results.map((item) => item.propertyId)).toContain("00000000-0000-0000-0000-000000000203");
  });

  it("inherits property and development documents without duplicates", async () => {
    const documents = await services.propertyDocumentsService.getPropertyDocuments({
      propertyId: "00000000-0000-0000-0000-000000000201",
      categories: ["brochure", "floor_plan"]
    });

    expect(documents.map((item) => item.id)).toEqual([
      "00000000-0000-0000-0000-000000000602",
      "00000000-0000-0000-0000-000000000601"
    ]);
    expect(documents.map((item) => item.category)).toEqual(["floor_plan", "brochure"]);
  });

  it("loads confirmed payment plans and rejects expired ones", async () => {
    const confirmed = await services.paymentPlanService.getPaymentPlan({
      propertyId: "00000000-0000-0000-0000-000000000201"
    });
    const expired = await services.paymentPlanService.getPaymentPlan({
      propertyId: "00000000-0000-0000-0000-000000000204"
    });

    expect(confirmed.available).toBe(true);
    expect(expired.available).toBe(false);
  });
});

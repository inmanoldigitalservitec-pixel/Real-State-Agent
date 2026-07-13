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
    expect(results.map((item) => item.propertyName)).toEqual(["Apartamento Urbano 3H Plus"]);
  });

  it("searches Santo Domingo as a geographic group across province and Distrito Nacional", async () => {
    const results = await services.propertySearchService.search({
      location: "Santo Domingo",
      propertyType: "apartment",
      availability: "available",
      limit: 10
    });
    const cities = new Set(results.map((item) => item.city));

    expect(cities).toEqual(new Set(["Santo Domingo", "Santo Domingo Norte", "Santo Domingo Este"]));
    expect(results.map((item) => item.propertyName)).toEqual(
      expect.arrayContaining([
        "Apartamento Familiar 3H",
        "Apartamento Compacto 2H",
        "Apartamento Urbano 3H Plus",
        "Apartamento Parque Este 2H"
      ])
    );
  });

  it("keeps Santo Domingo Este as a specific location search", async () => {
    const results = await services.propertySearchService.search({
      location: "Santo Domingo Este",
      propertyType: "apartment",
      availability: "available",
      limit: 10
    });

    expect(results.map((item) => item.propertyName)).toEqual(["Apartamento Parque Este 2H"]);
    expect(results.every((item) => item.city === "Santo Domingo Este")).toBe(true);
  });

  it("keeps Villa Mella as a specific flexible location search", async () => {
    const results = await services.propertySearchService.search({
      location: "Villa Mella",
      propertyType: "apartment",
      availability: "available",
      limit: 10
    });

    expect(results.map((item) => item.propertyName)).toEqual([
      "Apartamento Familiar 3H",
      "Apartamento Compacto 2H"
    ]);
    expect(results.every((item) => item.sector === "Villa Mella")).toBe(true);
  });

  it("returns scoped brochure and floor plan documents without duplicates", async () => {
    const propertyId = "00000000-0000-0000-0000-000000000201";
    const developmentId = "00000000-0000-0000-0000-000000000101";

    const documents = await services.propertyDocumentsService.getPropertyDocuments({
      propertyId,
      categories: ["brochure", "floor_plan"]
    });

    expect(documents.map((item) => item.category)).toEqual(
      expect.arrayContaining(["brochure", "floor_plan"])
    );

    expect(
      documents.every(
        (item) =>
          item.propertyId === propertyId ||
          item.developmentId === developmentId
      )
    ).toBe(true);

    const documentKeys = documents.map(
      (item) => `${item.category}|${item.bucketName}|${item.storagePath}`
    );

    expect(new Set(documentKeys).size).toBe(documentKeys.length);
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

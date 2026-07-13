import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadMonorepoEnv } from "../../src/config/load-env";
import { createApp } from "../../src/app";
import {
  assertRunCleanup,
  assertSeedSnapshotsEqual,
  captureSeedSnapshot,
  cleanupRunData,
  createRunScopedMessageId,
  createSupabaseTestRunId,
  createSupabaseTestFixture,
  getRunRecordCounts,
  supabaseTestSeeds,
  type SeedSnapshot,
  type SupabaseTestFixture
} from "../../src/testing/supabase-test-fixture";
import { createTaggedId } from "../../src/testing/run-id";

loadMonorepoEnv(import.meta.url);

const hasSupabaseEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!hasSupabaseEnv)("Internal API integration", () => {
  const authHeader = { Authorization: "Bearer integration-secret" };
  const activeFixtures = new Map<string, SupabaseTestFixture>();
  let app: ReturnType<typeof createApp>;
  let seedBefore: SeedSnapshot;

  beforeAll(async () => {
    process.env.AGENT_INTERNAL_API_KEY = "integration-secret";
    app = createApp();
    seedBefore = await captureSeedSnapshot();
  });

  afterEach(async () => {
    for (const fixture of activeFixtures.values()) {
      await fixture.cleanup();
      await assertRunCleanup(fixture.runId);
    }

    activeFixtures.clear();
  });

  afterAll(async () => {
    const seedAfter = await captureSeedSnapshot();
    assertSeedSnapshotsEqual(seedBefore, seedAfter);
  });

  async function post(path: string, body: unknown, extraHeaders?: Record<string, string>) {
    return app.request(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader,
        ...extraHeaders
      },
      body: JSON.stringify(body)
    });
  }

  async function withFixture<T>(
    callback: (fixture: SupabaseTestFixture) => Promise<T>
  ): Promise<{ result: T; runId: string }> {
    const fixture = await createSupabaseTestFixture();
    activeFixtures.set(fixture.runId, fixture);

    try {
      const result = await callback(fixture);
      return { result, runId: fixture.runId };
    } finally {
      await fixture.cleanup();
      await assertRunCleanup(fixture.runId);
      activeFixtures.delete(fixture.runId);
    }
  }

  it("rejects missing and invalid auth", async () => {
    const missing = await app.request("/internal/properties/search", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });
    const invalid = await app.request("/internal/properties/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer wrong"
      },
      body: JSON.stringify({})
    });

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
  });

  it("returns structured validation errors", async () => {
    const response = await app.request("/internal/properties/not-a-uuid", {
      headers: authHeader
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("resolves or creates conversations idempotently by external session", async () => {
    const runId = createSupabaseTestRunId();
    const externalSessionId = `${runId}_conversation_bootstrap`;

    try {
      const first = await post("/internal/conversations/resolve", {
        companyId: supabaseTestSeeds.companyId,
        channel: "web",
        externalSessionId,
        metadata: {
          runId
        }
      });
      const second = await post("/internal/conversations/resolve", {
        companyId: supabaseTestSeeds.companyId,
        channel: "web",
        externalSessionId,
        metadata: {
          runId
        }
      });
      const invalid = await post("/internal/conversations/resolve", {
        companyId: supabaseTestSeeds.companyId,
        channel: "web",
        externalSessionId: ""
      });

      expect(first.status).toBe(201);
      expect(second.status).toBe(200);
      expect(invalid.status).toBe(400);

      const firstBody = await first.json();
      const secondBody = await second.json();

      expect(firstBody.data.created).toBe(true);
      expect(secondBody.data.created).toBe(false);
      expect(secondBody.data.conversationId).toBe(firstBody.data.conversationId);
      expect(secondBody.data.companyId).toBe(supabaseTestSeeds.companyId);
      expect(secondBody.data.memoryVersion).toBe(1);

      const context = await app.request(`/internal/conversations/${firstBody.data.conversationId}/context`, {
        headers: authHeader
      });
      const contextBody = await context.json();

      expect(context.status).toBe(200);
      expect(contextBody.data.memory.companyId).toBe(supabaseTestSeeds.companyId);
      expect(contextBody.data.memory.sourceChannel).toBe("web");

      const counts = await getRunRecordCounts(runId);

      expect(counts.conversations).toBe(1);
      expect(counts.conversationStates).toBe(1);
    } finally {
      await cleanupRunData(runId);
      await assertRunCleanup(runId);
    }
  }, 15000);

  it("reads resources and hides internal fields", async () => {
    const { result } = await withFixture(async (fixture) => {
      const search = await post("/internal/properties/search", {
        companyId: fixture.companyId,
        location: "Distrito Nacional",
        bedrooms: 3,
        maximumPrice: 8000000,
        currency: "DOP"
      });
      const details = await app.request(`/internal/properties/${fixture.propertyId}`, { headers: authHeader });
      const availability = await app.request(`/internal/properties/${fixture.propertyId}/availability`, { headers: authHeader });
      const media = await post(`/internal/properties/${fixture.propertyId}/media`, {
        categories: ["cover_image", "property_gallery"]
      });
      const documents = await post(`/internal/properties/${fixture.propertyId}/documents`, {
        categories: ["brochure", "floor_plan"]
      });
      const paymentPlan = await app.request(`/internal/properties/${fixture.propertyId}/payment-plan`, { headers: authHeader });
      const company = await app.request(`/internal/companies/${fixture.companyId}/information`, { headers: authHeader });
      const context = await app.request(`/internal/conversations/${fixture.conversationId}/context`, { headers: authHeader });

      return {
        search,
        details,
        availability,
        media,
        documents,
        paymentPlan,
        company,
        context
      };
    });

    expect(result.search.status).toBe(200);
    expect(result.details.status).toBe(200);
    expect(result.availability.status).toBe(200);
    expect(result.media.status).toBe(200);
    expect(result.documents.status).toBe(200);
    expect(result.paymentPlan.status).toBe(200);
    expect(result.company.status).toBe(200);
    expect(result.context.status).toBe(200);

    const mediaBody = await result.media.json();
    const documentsBody = await result.documents.json();

    expect(mediaBody.data[0].bucketName).toBeUndefined();
    expect(mediaBody.data[0].storagePath).toBeUndefined();
    expect(documentsBody.data[0].bucketName).toBeUndefined();
    expect(documentsBody.data[0].storagePath).toBeUndefined();
  }, 15000);

  it("supports conversation state and message writes without contaminating seed data", async () => {
    const { result, runId } = await withFixture(async (fixture) => {
      const patchResponse = await app.request(`/internal/conversations/${fixture.conversationId}/state`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          pendingQuestion: "¿Prefieres que te comparta el brochure o el plano?"
        })
      });
      const clientMessageId = createRunScopedMessageId(fixture.runId, "http-message");
      const messageResponse = await app.request(`/internal/conversations/${fixture.conversationId}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          companyId: fixture.companyId,
          role: "user",
          content: "Quiero el brochure",
          clientMessageId,
          rawPayload: {
            runId: fixture.runId
          }
        })
      });

      expect(patchResponse.status).toBe(200);
      expect(messageResponse.status).toBe(201);
      expect((await messageResponse.json()).data.assetIds).toEqual([]);

      return getRunRecordCounts(fixture.runId);
    });

    const counts = await result;
    expect(runId.startsWith("itest_")).toBe(true);
    expect(counts.conversations).toBe(1);
    expect(counts.conversationStates).toBe(1);
    expect(counts.messages).toBe(1);
  }, 15000);

  it("supports the 4B.1 search_properties query and state memory flow", async () => {
    const runId = createSupabaseTestRunId();
    const externalSessionId = `${runId}_search_properties`;

    try {
      const resolve = await post("/internal/conversations/resolve", {
        companyId: supabaseTestSeeds.companyId,
        channel: "web",
        externalSessionId,
        metadata: {
          runId
        }
      });

      expect(resolve.status).toBe(201);

      const resolveBody = await resolve.json();
      const conversationId = resolveBody.data.conversationId as string;
      const search = await post("/internal/properties/search", {
        companyId: supabaseTestSeeds.companyId,
        location: "Santo Domingo",
        bedrooms: 3,
        propertyType: "apartment",
        limit: 3
      });

      expect(search.status).toBe(200);

      const searchBody = await search.json();
      const propertyIds = searchBody.data.map((property: { propertyId: string }) => property.propertyId);

      expect(propertyIds.length).toBeGreaterThan(0);
      expect(propertyIds.length).toBeLessThanOrEqual(3);

      const patch = await app.request(`/internal/conversations/${conversationId}/state`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          preferredLocations: ["Santo Domingo"],
          bedrooms: 3,
          propertyTypes: ["apartment"],
          recommendedPropertyIds: propertyIds,
          recentPropertyIds: propertyIds,
          lastCustomerIntent: "property_search",
          salesStage: "RECOMMENDATION"
        })
      });

      expect(patch.status).toBe(200);

      const context = await app.request(`/internal/conversations/${conversationId}/context`, {
        headers: authHeader
      });
      const contextBody = await context.json();

      expect(context.status).toBe(200);
      expect(contextBody.data.memory.preferredLocations).toContain("Santo Domingo");
      expect(contextBody.data.memory.bedrooms).toBe(3);
      expect(contextBody.data.memory.propertyTypes).toContain("apartment");
      expect(contextBody.data.memory.recommendedPropertyIds).toEqual(expect.arrayContaining(propertyIds));
      expect(contextBody.data.memory.lastCustomerIntent).toBe("property_search");
      expect(contextBody.data.memory.salesStage).toBe("RECOMMENDATION");
    } finally {
      await cleanupRunData(runId);
      await assertRunCleanup(runId);
    }
  }, 15000);

  it("supports lead and visit writes with idempotency using isolated fixture data", async () => {
    const { result } = await withFixture(async (fixture) => {
      const leadResponse = await post("/internal/leads", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        sourceListingId: fixture.listingId,
        sourcePropertyId: fixture.propertyId,
        sourcePropertyUnitId: fixture.propertyUnitId,
        fullName: fixture.customerName,
        phone: fixture.phone,
        email: fixture.email
      });
      const idempotencyKey = createTaggedId(fixture.runId, "visit");
      const firstVisit = await post("/internal/visits", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        developmentId: fixture.developmentId,
        propertyId: fixture.propertyId,
        propertyUnitId: fixture.propertyUnitId,
        customerName: fixture.customerName,
        phone: fixture.phone,
        email: fixture.email,
        preferredDate: "2026-07-20",
        idempotencyKey
      });
      const secondVisit = await post("/internal/visits", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        developmentId: fixture.developmentId,
        propertyId: fixture.propertyId,
        propertyUnitId: fixture.propertyUnitId,
        customerName: fixture.customerName,
        phone: fixture.phone,
        email: fixture.email,
        preferredDate: "2026-07-20",
        idempotencyKey
      });

      expect(leadResponse.status).toBe(201);
      expect(firstVisit.status).toBe(201);
      expect(secondVisit.status).toBe(201);
      expect((await firstVisit.json()).data.id).toBe((await secondVisit.json()).data.id);

      return getRunRecordCounts(fixture.runId);
    });

    const counts = await result;
    expect(counts.leads).toBe(1);
    expect(counts.visitRequests).toBe(1);
  }, 15000);

  it("supports handoff with and without contact and deduplicates within the same run", async () => {
    const { result } = await withFixture(async (fixture) => {
      const leadResponse = await post("/internal/leads", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        sourceListingId: fixture.listingId,
        sourcePropertyId: fixture.propertyId,
        sourcePropertyUnitId: fixture.propertyUnitId,
        fullName: fixture.customerName,
        phone: fixture.phone,
        email: fixture.email
      });

      expect(leadResponse.status).toBe(201);

      const idempotencyKey = createTaggedId(fixture.runId, "handoff");
      const noContactKey = createTaggedId(fixture.runId, "handoff-no-contact");
      const first = await post("/internal/handoffs", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        reason: "requested_by_customer",
        note: "Cliente pide seguimiento humano",
        propertyId: fixture.propertyId,
        unitId: fixture.propertyUnitId,
        listingId: fixture.listingId,
        contact: {
          fullName: fixture.customerName,
          phone: fixture.phone,
          email: fixture.email,
          preferredContactMethod: "whatsapp"
        },
        idempotencyKey
      });
      const second = await post("/internal/handoffs", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        reason: "requested_by_customer",
        note: "Cliente pide seguimiento humano",
        propertyId: fixture.propertyId,
        unitId: fixture.propertyUnitId,
        listingId: fixture.listingId,
        idempotencyKey
      });
      const third = await post("/internal/handoffs", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        reason: "high_intent",
        note: "Cliente prefiere seguimiento sin dejar contacto nuevo",
        propertyId: fixture.propertyId,
        unitId: fixture.propertyUnitId,
        listingId: fixture.listingId,
        idempotencyKey: noContactKey
      });

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect(third.status).toBe(201);
      expect((await first.json()).data.eventId).toBe((await second.json()).data.eventId);

      return getRunRecordCounts(fixture.runId);
    });

    const counts = await result;
    expect(counts.leads).toBe(1);
    expect(counts.agentEvents).toBe(2);
  }, 15000);

  it("keeps the seed conversation and seed lead unchanged after isolated writes", async () => {
    const before = await captureSeedSnapshot();

    await withFixture(async (fixture) => {
      await app.request(`/internal/conversations/${fixture.conversationId}/state`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          pendingQuestion: "¿Quieres brochure o visita?"
        })
      });
      await app.request(`/internal/conversations/${fixture.conversationId}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          companyId: fixture.companyId,
          role: "user",
          content: "Me interesa agendar",
          clientMessageId: createRunScopedMessageId(fixture.runId, "seed-check-message"),
          rawPayload: {
            runId: fixture.runId
          }
        })
      });
      await post("/internal/leads", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        sourceListingId: fixture.listingId,
        sourcePropertyId: fixture.propertyId,
        sourcePropertyUnitId: fixture.propertyUnitId,
        fullName: fixture.customerName,
        phone: fixture.phone,
        email: fixture.email
      });
      await post("/internal/visits", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        developmentId: fixture.developmentId,
        propertyId: fixture.propertyId,
        propertyUnitId: fixture.propertyUnitId,
        customerName: fixture.customerName,
        phone: fixture.phone,
        email: fixture.email,
        preferredDate: "2026-07-20",
        idempotencyKey: createTaggedId(fixture.runId, "seed-check-visit")
      });
      await post("/internal/handoffs", {
        companyId: fixture.companyId,
        conversationId: fixture.conversationId,
        reason: "requested_by_customer",
        note: "Verificacion de aislamiento",
        propertyId: fixture.propertyId,
        unitId: fixture.propertyUnitId,
        listingId: fixture.listingId,
        contact: {
          fullName: fixture.customerName,
          phone: fixture.phone,
          email: fixture.email,
          preferredContactMethod: "whatsapp"
        },
        idempotencyKey: createTaggedId(fixture.runId, "seed-check-handoff")
      });
    });

    const after = await captureSeedSnapshot();
    assertSeedSnapshotsEqual(before, after);
  }, 15000);
});

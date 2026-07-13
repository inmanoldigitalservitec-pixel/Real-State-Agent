import { loadMonorepoEnv } from "../config/load-env";
import { createApp } from "../app";
import {
  assertRunCleanup,
  assertSeedSnapshotsEqual,
  captureSeedSnapshot,
  createSupabaseTestFixture,
  createRunScopedMessageId,
  getRunRecordCounts,
  listRunRecords
} from "../testing/supabase-test-fixture";
import { createTaggedId } from "../testing/run-id";

const envPath = loadMonorepoEnv(import.meta.url);
process.env.AGENT_INTERNAL_API_KEY ??= "smoke-internal-key";

const app = createApp();
const authHeaders = {
  Authorization: `Bearer ${process.env.AGENT_INTERNAL_API_KEY}`,
  "content-type": "application/json"
};

function summarize(title: string, payload: unknown) {
  console.log(`\n## ${title}`);
  console.log(JSON.stringify(payload, null, 2));
}

async function requestJson(path: string, init?: RequestInit) {
  const response = await app.request(path, init);
  const body = await response.json();

  return { status: response.status, body };
}

async function main() {
  summarize("env", { envPath });
  const seedBefore = await captureSeedSnapshot();
  const fixture = await createSupabaseTestFixture();
  let cleanupSummary = null;

  summarize("fixture", {
    runId: fixture.runId,
    conversationId: fixture.conversationId,
    conversationStateId: fixture.conversationStateId,
    externalSessionId: fixture.externalSessionId
  });

  try {
    summarize("1.health", await requestJson("/health"));
    summarize(
      "2.reject_without_api_key",
      await requestJson("/internal/properties/search", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      })
    );
    summarize(
      "3.searchProperties",
      await requestJson("/internal/properties/search", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          companyId: fixture.companyId,
          location: "Distrito Nacional",
          bedrooms: 3,
          maximumPrice: 8000000,
          currency: "DOP"
        })
      })
    );
    summarize(
      "4.resolvePropertyReference",
      await requestJson("/internal/properties/resolve-reference", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          reference: "Villa Mella",
          sourcePropertyId: fixture.propertyId
        })
      })
    );
    summarize("5.getPropertyDetails", await requestJson(`/internal/properties/${fixture.propertyId}`, { headers: authHeaders }));
    summarize(
      "6.availability",
      await requestJson(`/internal/properties/${fixture.propertyId}/availability`, { headers: authHeaders })
    );
    summarize(
      "7.media",
      await requestJson(`/internal/properties/${fixture.propertyId}/media`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          categories: ["cover_image", "property_gallery"]
        })
      })
    );
    summarize(
      "8.documents",
      await requestJson(`/internal/properties/${fixture.propertyId}/documents`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          categories: ["brochure", "floor_plan"]
        })
      })
    );
    summarize(
      "9.paymentPlan",
      await requestJson(`/internal/properties/${fixture.propertyId}/payment-plan`, {
        headers: authHeaders
      })
    );
    summarize(
      "10.companyInformation",
      await requestJson(`/internal/companies/${fixture.companyId}/information`, { headers: authHeaders })
    );
    summarize(
      "11.conversationContext",
      await requestJson(`/internal/conversations/${fixture.conversationId}/context`, { headers: authHeaders })
    );
    summarize(
      "12.updateConversationState",
      await requestJson(`/internal/conversations/${fixture.conversationId}/state`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          pendingQuestion: "¿Prefieres que te comparta el brochure o el plano?"
        })
      })
    );

    const clientMessageId = createRunScopedMessageId(fixture.runId, "smoke-message");
    summarize(
      "13.saveMessage",
      await requestJson(`/internal/conversations/${fixture.conversationId}/messages`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          companyId: fixture.companyId,
          role: "user",
          content: "Quiero el brochure",
          clientMessageId,
          rawPayload: {
            runId: fixture.runId
          }
        })
      })
    );
    summarize(
      "14.captureLead",
      await requestJson("/internal/leads", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          companyId: fixture.companyId,
          conversationId: fixture.conversationId,
          sourcePropertyId: fixture.propertyId,
          sourcePropertyUnitId: fixture.propertyUnitId,
          sourceListingId: fixture.listingId,
          fullName: fixture.customerName,
          phone: fixture.phone,
          email: fixture.email
        })
      })
    );

    const visitKey = createTaggedId(fixture.runId, "visit");
    summarize(
      "15.requestVisit",
      await requestJson("/internal/visits", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          companyId: fixture.companyId,
          conversationId: fixture.conversationId,
          propertyId: fixture.propertyId,
          propertyUnitId: fixture.propertyUnitId,
          developmentId: fixture.developmentId,
          customerName: fixture.customerName,
          phone: fixture.phone,
          email: fixture.email,
          preferredDate: "2026-07-20",
          idempotencyKey: visitKey
        })
      })
    );

    const handoffKey = createTaggedId(fixture.runId, "handoff");
    summarize(
      "16.requestHumanHandoff",
      await requestJson("/internal/handoffs", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          companyId: fixture.companyId,
          conversationId: fixture.conversationId,
          reason: "requested_by_customer",
          note: "Seguimiento humano solicitado desde smoke test",
          propertyId: fixture.propertyId,
          unitId: fixture.propertyUnitId,
          listingId: fixture.listingId,
          contact: {
            fullName: fixture.customerName,
            phone: fixture.phone,
            email: fixture.email,
            preferredContactMethod: "whatsapp"
          },
          idempotencyKey: handoffKey
        })
      })
    );

    summarize("17.recordsWritten", {
      runId: fixture.runId,
      counts: await getRunRecordCounts(fixture.runId),
      records: await listRunRecords(fixture.runId)
    });
  } finally {
    cleanupSummary = await fixture.cleanup();
    const cleanupCounts = await assertRunCleanup(fixture.runId);
    const seedAfter = await captureSeedSnapshot();
    assertSeedSnapshotsEqual(seedBefore, seedAfter);

    summarize("18.cleanup", {
      runId: fixture.runId,
      cleanupSummary,
      cleanupCounts,
      seedUnchanged: true
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

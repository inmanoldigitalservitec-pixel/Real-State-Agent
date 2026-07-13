type TestHelpers = {
  assertRunCleanup: (runId: string) => Promise<void>;
  assertSeedSnapshotsEqual: (before: unknown, after: unknown) => void;
  captureSeedSnapshot: () => Promise<unknown>;
  cleanupRunData: (runId: string) => Promise<unknown>;
  createSupabaseTestRunId: () => string;
  getRunRecordCounts: (runId: string) => Promise<unknown>;
  supabaseTestSeeds: {
    companyId: string;
  };
};

const loadEnvModule = (await import(
  new URL("../../../../apps/agent-core/src/config/load-env.ts", import.meta.url).href
)) as {
  loadMonorepoEnv: (fromUrl: string) => string | null;
};
const helpers = (await import(
  new URL("../../../../apps/agent-core/src/testing/supabase-test-fixture.ts", import.meta.url).href
)) as TestHelpers;

const envPath = loadEnvModule.loadMonorepoEnv(import.meta.url);
const baseUrl = (process.env.OPENCLAW_AGENT_CORE_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/+$/, "");
const internalApiKey = process.env.AGENT_INTERNAL_API_KEY ?? process.env.OPENCLAW_AGENT_CORE_API_KEY;

if (!internalApiKey) {
  throw new Error("AGENT_INTERNAL_API_KEY or OPENCLAW_AGENT_CORE_API_KEY is required for search_properties smoke test");
}

const authHeaders = {
  Authorization: `Bearer ${internalApiKey}`,
  "content-type": "application/json"
};

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();

  return { status: response.status, body };
}

function summarize(title: string, payload: unknown) {
  console.log(`\n## ${title}`);
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  summarize("env", { envPath, baseUrl });

  const seedBefore = await helpers.captureSeedSnapshot();
  const runId = helpers.createSupabaseTestRunId();
  const externalSessionId = `${runId}_search_properties`;
  let conversationId: string | undefined;

  try {
    const health = await requestJson("/health");

    if (health.status !== 200) {
      throw new Error(`agent-core is not healthy at ${baseUrl}`);
    }

    const resolve = await requestJson("/internal/conversations/resolve", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        companyId: helpers.supabaseTestSeeds.companyId,
        channel: "web",
        externalSessionId,
        metadata: {
          runId
        }
      })
    });

    if (resolve.status !== 201) {
      throw new Error(`Unexpected resolve status: ${resolve.status}`);
    }

    const resolveBody = resolve.body as { data: { conversationId: string } };
    conversationId = resolveBody.data.conversationId;

    const context = await requestJson(`/internal/conversations/${conversationId}/context`, {
      headers: authHeaders
    });

    if (context.status !== 200) {
      throw new Error(`Unexpected context status: ${context.status}`);
    }

    const search = await requestJson("/internal/properties/search", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        companyId: helpers.supabaseTestSeeds.companyId,
        location: "Santo Domingo",
        bedrooms: 3,
        propertyType: "apartment",
        limit: 3
      })
    });

    if (search.status !== 200) {
      throw new Error(`Unexpected search status: ${search.status}`);
    }

    const searchBody = search.body as {
      data: Array<{
        propertyId: string;
        propertyName: string;
        city: string;
        availableUnits: number;
      }>;
    };
    const propertyIds = searchBody.data.map((property) => property.propertyId);

    if (propertyIds.length === 0 || propertyIds.length > 3) {
      throw new Error(`Unexpected search result count: ${propertyIds.length}`);
    }

    const state = await requestJson(`/internal/conversations/${conversationId}/state`, {
      method: "PATCH",
      headers: authHeaders,
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

    if (state.status !== 200) {
      throw new Error(`Unexpected state status: ${state.status}`);
    }

    const reloadedContext = await requestJson(`/internal/conversations/${conversationId}/context`, {
      headers: authHeaders
    });
    const reloadedBody = reloadedContext.body as {
      data: {
        memory: {
          preferredLocations: string[];
          bedrooms: number;
          propertyTypes: string[];
          recommendedPropertyIds: string[];
          lastCustomerIntent: string;
          salesStage: string;
        };
      };
    };

    if (reloadedBody.data.memory.lastCustomerIntent !== "property_search") {
      throw new Error("Conversation state did not persist property_search intent");
    }

    summarize("search", {
      status: search.status,
      resultCount: searchBody.data.length,
      names: searchBody.data.map((property) => property.propertyName),
      cities: searchBody.data.map((property) => property.city),
      availableUnits: searchBody.data.map((property) => property.availableUnits)
    });
    summarize("state", {
      status: state.status,
      preferredLocations: reloadedBody.data.memory.preferredLocations,
      bedrooms: reloadedBody.data.memory.bedrooms,
      propertyTypes: reloadedBody.data.memory.propertyTypes,
      recommendedCount: reloadedBody.data.memory.recommendedPropertyIds.length,
      lastCustomerIntent: reloadedBody.data.memory.lastCustomerIntent,
      salesStage: reloadedBody.data.memory.salesStage
    });
    summarize("recordsWritten", {
      runId,
      counts: await helpers.getRunRecordCounts(runId)
    });
  } finally {
    const cleanupSummary = await helpers.cleanupRunData(runId);
    await helpers.assertRunCleanup(runId);
    const seedAfter = await helpers.captureSeedSnapshot();
    helpers.assertSeedSnapshotsEqual(seedBefore, seedAfter);
    summarize("cleanup", {
      runId,
      cleanupSummary,
      seedUnchanged: true
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

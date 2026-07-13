import { loadMonorepoEnv } from "../config/load-env";
import {
  assertRunCleanup,
  assertSeedSnapshotsEqual,
  captureSeedSnapshot,
  cleanupRunData,
  createRunScopedMessageId,
  createSupabaseTestRunId,
  getRunRecordCounts,
  supabaseTestSeeds
} from "../testing/supabase-test-fixture";

const envPath = loadMonorepoEnv(import.meta.url);
const baseUrl = (process.env.OPENCLAW_AGENT_CORE_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/+$/, "");
const internalApiKey = process.env.AGENT_INTERNAL_API_KEY ?? process.env.OPENCLAW_AGENT_CORE_API_KEY;

if (!internalApiKey) {
  throw new Error("AGENT_INTERNAL_API_KEY or OPENCLAW_AGENT_CORE_API_KEY is required for conversation bootstrap smoke test");
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
  const seedBefore = await captureSeedSnapshot();
  const runId = createSupabaseTestRunId();
  const externalSessionId = `${runId}_conversation_bootstrap`;

  try {
    const health = await requestJson("/health");

    if (health.status !== 200) {
      throw new Error(`agent-core is not healthy at ${baseUrl}`);
    }

    const first = await requestJson("/internal/conversations/resolve", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        companyId: supabaseTestSeeds.companyId,
        channel: "web",
        externalSessionId,
        metadata: {
          runId
        }
      })
    });
    const second = await requestJson("/internal/conversations/resolve", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        companyId: supabaseTestSeeds.companyId,
        channel: "web",
        externalSessionId,
        metadata: {
          runId
        }
      })
    });

    if (first.status !== 201 || second.status !== 200) {
      throw new Error(`Unexpected resolve statuses: ${first.status}, ${second.status}`);
    }

    const firstBody = first.body as { data: { conversationId: string; created: boolean } };
    const secondBody = second.body as { data: { conversationId: string; created: boolean } };

    if (firstBody.data.conversationId !== secondBody.data.conversationId) {
      throw new Error("Conversation resolve was not idempotent");
    }

    const conversationId = firstBody.data.conversationId;
    const context = await requestJson(`/internal/conversations/${conversationId}/context`, {
      headers: authHeaders
    });
    const messageId = createRunScopedMessageId(runId, "conversation-bootstrap-message");
    const message = await requestJson(`/internal/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        companyId: supabaseTestSeeds.companyId,
        role: "user",
        content: "Mensaje temporal de smoke test",
        clientMessageId: messageId,
        rawPayload: {
          runId
        }
      })
    });

    summarize("resolve", {
      firstStatus: first.status,
      secondStatus: second.status,
      sameConversation: firstBody.data.conversationId === secondBody.data.conversationId,
      created: firstBody.data.created,
      repeatedCreated: secondBody.data.created
    });
    const contextBody = context.body as { data: { currentSalesStage: string; memory: unknown | null } };
    const messageBody = message.body as { data: { role: string } };

    summarize("context", {
      status: context.status,
      currentSalesStage: contextBody.data.currentSalesStage,
      hasMemory: Boolean(contextBody.data.memory)
    });
    summarize("message", {
      status: message.status,
      role: messageBody.data.role,
      hasClientMessageId: true
    });
    summarize("recordsWritten", {
      runId,
      counts: await getRunRecordCounts(runId)
    });
  } finally {
    const cleanupSummary = await cleanupRunData(runId);
    await assertRunCleanup(runId);
    const seedAfter = await captureSeedSnapshot();
    assertSeedSnapshotsEqual(seedBefore, seedAfter);
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

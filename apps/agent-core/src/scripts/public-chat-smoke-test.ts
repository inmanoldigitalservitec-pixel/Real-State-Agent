import {
  publicChatResponseSchema,
  publicHealthResponseSchema,
  type PublicChatResponse
} from "@real-estate-agent/shared";
import { loadMonorepoEnv } from "../config/load-env";

const envPath = loadMonorepoEnv(import.meta.url);

const baseUrl = (
  process.env.PUBLIC_CHAT_BASE_URL ??
  process.env.OPENCLAW_AGENT_CORE_BASE_URL ??
  "http://127.0.0.1:8787"
).replace(/\/+$/, "");

const firstMessage =
  process.env.PUBLIC_CHAT_SMOKE_FIRST_MESSAGE?.trim() ||
  "Hola Carlos. Busco un apartamento de 3 habitaciones en Villa Mella.";

const secondMessage =
  process.env.PUBLIC_CHAT_SMOKE_SECOND_MESSAGE?.trim() ||
  "Mi presupuesto máximo es de RD$8,000,000. ¿Qué opciones tienes?";

const forbiddenKeys = [
  "sessionKey",
  "agentId",
  "provider",
  "model",
  "usage",
  "workspaceDir",
  "runId",
  "tokens",
  "systemPromptReport",
  "tools",
  "openclaw",
  "/Users/",
  "127.0.0.1",
  "localhost",
  "file://"
];

type JsonResult = {
  status: number;
  body: unknown;
  requestId: string | null;
};

async function requestJson(
  path: string,
  init?: RequestInit
): Promise<JsonResult> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, init);
  } catch (error) {
    throw new Error(
      `Could not connect to Agent Core at ${baseUrl}. ` +
        "Confirm that Agent Core is running.",
      { cause: error }
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(
      `Agent Core returned a non-JSON response for ${path}`
    );
  }

  return {
    status: response.status,
    body,
    requestId: response.headers.get("x-request-id")
  };
}

function assertNoInternalMetadata(
  label: string,
  payload: unknown
): void {
  const serialized = JSON.stringify(payload);

  for (const forbidden of forbiddenKeys) {
    if (
      serialized
        .toLowerCase()
        .includes(forbidden.toLowerCase())
    ) {
      throw new Error(
        `${label} exposed forbidden internal data: ${forbidden}`
      );
    }
  }
}

function summarizeChat(
  response: PublicChatResponse
): Record<string, unknown> {
  return {
    success: response.success,
    sessionId: response.data.sessionId,
    message: response.data.message,
    payloads: response.data.payloads.map((payload) =>
      payload.type === "text"
        ? {
            type: payload.type,
            text: payload.text
          }
        : {
            type: payload.type,
            url: payload.url
          }
    )
  };
}

function printSafe(
  title: string,
  payload: unknown
): void {
  console.log(`\n## ${title}`);
  console.log(JSON.stringify(payload, null, 2));
}

async function main(): Promise<void> {
  printSafe("configuration", {
    envPath,
    baseUrl,
    openClawBinary:
      process.env.OPENCLAW_BIN ?? "openclaw",
    agentId:
      process.env.OPENCLAW_AGENT_ID ??
      "real-estate-agent"
  });

  const healthResult = await requestJson(
    "/public/health"
  );

  if (healthResult.status !== 200) {
    throw new Error(
      `Public health failed with HTTP ${healthResult.status}`
    );
  }

  const health =
    publicHealthResponseSchema.parse(
      healthResult.body
    );

  assertNoInternalMetadata(
    "health response",
    health
  );

  printSafe("1.publicHealth", {
    status: healthResult.status,
    requestId: healthResult.requestId,
    body: health
  });

  const firstResult = await requestJson(
    "/public/chat",
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: firstMessage
      })
    }
  );

  if (firstResult.status !== 200) {
    printSafe(
      "firstChatFailure",
      firstResult.body
    );

    throw new Error(
      `First public chat request failed with HTTP ${firstResult.status}`
    );
  }

  const first =
    publicChatResponseSchema.parse(
      firstResult.body
    );

  assertNoInternalMetadata(
    "first chat response",
    first
  );

  if (!first.data.message.trim()) {
    throw new Error(
      "First chat response did not contain visible text"
    );
  }

  printSafe("2.firstChat", {
    status: firstResult.status,
    requestId: firstResult.requestId,
    response: summarizeChat(first)
  });

  const secondResult = await requestJson(
    "/public/chat",
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sessionId: first.data.sessionId,
        message: secondMessage
      })
    }
  );

  if (secondResult.status !== 200) {
    printSafe(
      "secondChatFailure",
      secondResult.body
    );

    throw new Error(
      `Second public chat request failed with HTTP ${secondResult.status}`
    );
  }

  const second =
    publicChatResponseSchema.parse(
      secondResult.body
    );

  assertNoInternalMetadata(
    "second chat response",
    second
  );

  if (
    second.data.sessionId !==
    first.data.sessionId
  ) {
    throw new Error(
      "Public session ID was not reused"
    );
  }

  if (!second.data.message.trim()) {
    throw new Error(
      "Second chat response did not contain visible text"
    );
  }

  printSafe("3.secondChat", {
    status: secondResult.status,
    requestId: secondResult.requestId,
    sameSession:
      second.data.sessionId ===
      first.data.sessionId,
    response: summarizeChat(second)
  });

  printSafe("result", {
    success: true,
    publicHealth: true,
    firstChat: true,
    secondChat: true,
    sessionReused: true,
    internalMetadataExposed: false
  });
}

main().catch((error) => {
  console.error("\n## smokeFailure");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Unknown smoke-test failure");
  }

  process.exitCode = 1;
});

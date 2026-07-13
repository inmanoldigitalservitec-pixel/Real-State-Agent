import { spawn } from "node:child_process";
import { z } from "zod";

const DEFAULT_AGENT_ID = "real-estate-agent";
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_OUTPUT_BYTES = 1_048_576;

const openClawPayloadSchema = z
  .object({
    text: z.string().nullable().optional(),
    mediaUrl: z.string().nullable().optional()
  })
  .passthrough();

const openClawResponseSchema = z
  .object({
    status: z.string(),
    result: z
      .object({
        payloads: z.array(openClawPayloadSchema).optional(),
        meta: z
          .object({
            finalAssistantVisibleText: z.string().optional()
          })
          .passthrough()
          .optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough();

export type OpenClawVisiblePayload =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "media";
      url: string;
    };

export type OpenClawAgentResponse = {
  message: string;
  payloads: OpenClawVisiblePayload[];
};

export type OpenClawRunnerInput = {
  binary: string;
  args: string[];
  timeoutMs: number;
  maxOutputBytes: number;
};

export type OpenClawRunnerResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type OpenClawRunner = (
  input: OpenClawRunnerInput
) => Promise<OpenClawRunnerResult>;

export type OpenClawAgentClientOptions = {
  binary?: string;
  agentId?: string;
  timeoutMs?: number;
  maxOutputBytes?: number;
  runner?: OpenClawRunner;
};

export type OpenClawAgentRequest = {
  sessionId: string;
  message: string;
};

export type OpenClawAgentClientErrorCode =
  | "OPENCLAW_TIMEOUT"
  | "OPENCLAW_OUTPUT_LIMIT"
  | "OPENCLAW_PROCESS_FAILED"
  | "OPENCLAW_INVALID_RESPONSE"
  | "OPENCLAW_EMPTY_RESPONSE";

export class OpenClawAgentClientError extends Error {
  public readonly code: OpenClawAgentClientErrorCode;

  constructor(code: OpenClawAgentClientErrorCode, message: string) {
    super(message);
    this.name = "OpenClawAgentClientError";
    this.code = code;
  }
}

function appendChunk(
  current: Buffer[],
  chunk: Buffer,
  state: { totalBytes: number },
  maxOutputBytes: number
): boolean {
  state.totalBytes += chunk.byteLength;

  if (state.totalBytes > maxOutputBytes) {
    return false;
  }

  current.push(chunk);
  return true;
}

export const spawnOpenClawRunner: OpenClawRunner = ({
  binary,
  args,
  timeoutMs,
  maxOutputBytes
}) =>
  new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const outputState = { totalBytes: 0 };

    let settled = false;
    let timedOut = false;
    let outputLimitExceeded = false;

    const finish = (result: OpenClawRunnerResult) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (rawChunk: Buffer | string) => {
      const chunk = Buffer.isBuffer(rawChunk)
        ? rawChunk
        : Buffer.from(rawChunk);

      if (
        !appendChunk(
          stdoutChunks,
          chunk,
          outputState,
          maxOutputBytes
        )
      ) {
        outputLimitExceeded = true;
        child.kill("SIGKILL");
      }
    });

    child.stderr.on("data", (rawChunk: Buffer | string) => {
      const chunk = Buffer.isBuffer(rawChunk)
        ? rawChunk
        : Buffer.from(rawChunk);

      if (
        !appendChunk(
          stderrChunks,
          chunk,
          outputState,
          maxOutputBytes
        )
      ) {
        outputLimitExceeded = true;
        child.kill("SIGKILL");
      }
    });

    child.once("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      reject(error);
    });

    child.once("close", (exitCode) => {
      finish({
        exitCode,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: outputLimitExceeded
          ? "__OPENCLAW_OUTPUT_LIMIT__"
          : Buffer.concat(stderrChunks).toString("utf8"),
        timedOut
      });
    });
  });

function normalizeVisiblePayloads(
  response: z.infer<typeof openClawResponseSchema>
): OpenClawAgentResponse {
  const result = response.result;
  const normalized: OpenClawVisiblePayload[] = [];

  for (const payload of result?.payloads ?? []) {
    const text = payload.text?.trim();

    if (text) {
      normalized.push({
        type: "text",
        text
      });
    }

    const mediaUrl = payload.mediaUrl?.trim();

    if (mediaUrl) {
      normalized.push({
        type: "media",
        url: mediaUrl
      });
    }
  }

  const visibleTexts = normalized
    .filter(
      (
        payload
      ): payload is Extract<OpenClawVisiblePayload, { type: "text" }> =>
        payload.type === "text"
    )
    .map((payload) => payload.text);

  const fallbackText =
    result?.meta?.finalAssistantVisibleText?.trim() ?? "";

  if (visibleTexts.length === 0 && fallbackText) {
    normalized.unshift({
      type: "text",
      text: fallbackText
    });

    visibleTexts.push(fallbackText);
  }

  const message = visibleTexts.join("\n\n").trim();

  if (!message && normalized.length === 0) {
    throw new OpenClawAgentClientError(
      "OPENCLAW_EMPTY_RESPONSE",
      "The agent returned no visible content"
    );
  }

  return {
    message,
    payloads: normalized
  };
}

export class OpenClawAgentClient {
  private readonly binary: string;
  private readonly agentId: string;
  private readonly timeoutMs: number;
  private readonly maxOutputBytes: number;
  private readonly runner: OpenClawRunner;

  constructor(options: OpenClawAgentClientOptions = {}) {
    this.binary =
      options.binary ?? process.env.OPENCLAW_BIN?.trim() ?? "openclaw";

    this.agentId =
      options.agentId ??
      process.env.OPENCLAW_AGENT_ID?.trim() ??
      DEFAULT_AGENT_ID;

    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxOutputBytes =
      options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    this.runner = options.runner ?? spawnOpenClawRunner;
  }

  async sendMessage(
    request: OpenClawAgentRequest
  ): Promise<OpenClawAgentResponse> {
    const sessionId = request.sessionId.trim();
    const message = request.message.trim();

    const sessionKey =
      `agent:${this.agentId}:web-${sessionId}`;

    const timeoutSeconds = Math.max(
      1,
      Math.ceil(this.timeoutMs / 1_000)
    );

    let processResult: OpenClawRunnerResult;

    try {
      processResult = await this.runner({
        binary: this.binary,
        args: [
          "agent",
          "--agent",
          this.agentId,
          "--session-key",
          sessionKey,
          "--message",
          message,
          "--json",
          "--timeout",
          String(timeoutSeconds)
        ],
        timeoutMs: this.timeoutMs,
        maxOutputBytes: this.maxOutputBytes
      });
    } catch {
      throw new OpenClawAgentClientError(
        "OPENCLAW_PROCESS_FAILED",
        "The agent process could not be started"
      );
    }

    if (processResult.timedOut) {
      throw new OpenClawAgentClientError(
        "OPENCLAW_TIMEOUT",
        "The agent response timed out"
      );
    }

    if (processResult.stderr === "__OPENCLAW_OUTPUT_LIMIT__") {
      throw new OpenClawAgentClientError(
        "OPENCLAW_OUTPUT_LIMIT",
        "The agent response exceeded the output limit"
      );
    }

    if (processResult.exitCode !== 0) {
      throw new OpenClawAgentClientError(
        "OPENCLAW_PROCESS_FAILED",
        "The agent process failed"
      );
    }

    let rawResponse: unknown;

    try {
      rawResponse = JSON.parse(processResult.stdout);
    } catch {
      throw new OpenClawAgentClientError(
        "OPENCLAW_INVALID_RESPONSE",
        "The agent returned invalid JSON"
      );
    }

    const parsed = openClawResponseSchema.safeParse(rawResponse);

    if (!parsed.success || parsed.data.status !== "ok") {
      throw new OpenClawAgentClientError(
        "OPENCLAW_INVALID_RESPONSE",
        "The agent returned an invalid response"
      );
    }

    return normalizeVisiblePayloads(parsed.data);
  }
}

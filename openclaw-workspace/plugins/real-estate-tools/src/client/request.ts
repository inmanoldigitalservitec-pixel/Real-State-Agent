import { AgentCoreClientError } from "./errors.js";
import type { PluginLogger, RequestOptions, ResolvedAgentCorePluginConfig } from "../types.js";

export async function requestJson(
  config: ResolvedAgentCorePluginConfig,
  logger: PluginLogger,
  options: RequestOptions
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("timeout")), config.timeoutMs);
  const cleanupExternal = options.signal ? forwardAbort(options.signal, controller) : undefined;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Correlation-Id": options.correlationId
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.auth !== false) {
      const token = process.env[config.internalApiKeyEnvVar]?.trim();

      if (!token) {
        throw new AgentCoreClientError({
          message: `Missing environment variable ${config.internalApiKeyEnvVar}`,
          code: "CONFIGURATION_ERROR",
          correlationId: options.correlationId
        });
      }

      headers.Authorization = `Bearer ${token}`;
    }

    logger.debug("agent-core request", {
      method: options.method ?? "GET",
      path: options.path,
      correlationId: options.correlationId,
      rawPayload: options.rawPayload
    });

    const response = await fetch(`${config.baseUrl}${options.path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });

    const body = await parseResponseBody(response);

    return {
      response,
      body
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw new AgentCoreClientError({
        message: `agent-core request aborted for ${options.path}`,
        code: "EXTERNAL_TIMEOUT",
        retryable: true,
        correlationId: options.correlationId,
        cause: error
      });
    }

    if (error instanceof AgentCoreClientError) {
      throw error;
    }

    throw new AgentCoreClientError({
      message: `agent-core request failed for ${options.path}`,
      code: "EXTERNAL_ERROR",
      retryable: true,
      correlationId: options.correlationId,
      cause: error
    });
  } finally {
    clearTimeout(timeoutId);
    cleanupExternal?.();
  }
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new AgentCoreClientError({
      message: `agent-core returned invalid JSON (${response.status})`,
      code: "EXTERNAL_ERROR",
      status: response.status,
      retryable: false,
      cause: error
    });
  }
}

function forwardAbort(signal: AbortSignal, controller: AbortController) {
  const onAbort = () => controller.abort(signal.reason);

  signal.addEventListener("abort", onAbort, { once: true });

  if (signal.aborted) {
    controller.abort(signal.reason);
  }

  return () => signal.removeEventListener("abort", onAbort);
}

function isAbortError(error: unknown) {
  return error instanceof Error && (error.name === "AbortError" || error.message === "timeout");
}

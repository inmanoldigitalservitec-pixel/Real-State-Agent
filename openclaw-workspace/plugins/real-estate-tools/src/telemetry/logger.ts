import { redactSecrets } from "./redact.js";
import type { PluginLogger } from "../types.js";

export function createLogger(apiLogger: unknown): PluginLogger {
  const candidate = (apiLogger ?? {}) as {
    debug?: (message: string, payload?: unknown) => void;
    info?: (message: string, payload?: unknown) => void;
    warn?: (message: string, payload?: unknown) => void;
    error?: (message: string, payload?: unknown) => void;
  };

  return {
    debug: (message, payload) => candidate.debug?.(message, redactSecrets(payload)),
    info: (message, payload) => candidate.info?.(message, redactSecrets(payload)),
    warn: (message, payload) => candidate.warn?.(message, redactSecrets(payload)),
    error: (message, payload) => candidate.error?.(message, redactSecrets(payload))
  };
}

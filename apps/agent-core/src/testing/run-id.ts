import type { Json } from "../infrastructure/supabase/types";

type JsonObject = Record<string, Json | undefined>;

function isJsonObject(value: Json | null | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createTaggedId(runId: string, suffix: string): string {
  return `${runId}:${suffix}`;
}

export function extractRunIdFromTaggedValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const [candidate] = value.split(":", 1);
  return candidate.startsWith("itest_") ? candidate : null;
}

export function getRunIdFromMetadata(metadata: Json | null | undefined): string | null {
  if (!isJsonObject(metadata)) {
    return null;
  }

  return typeof metadata.runId === "string" ? metadata.runId : null;
}

export function mergeJsonObject(
  value: Json | null | undefined,
  patch: Record<string, Json | undefined>
): Json {
  return {
    ...(isJsonObject(value) ? value : {}),
    ...patch
  };
}

export function withRunIdMetadata(
  value: Json | null | undefined,
  runId: string | null,
  patch?: Record<string, Json | undefined>
) {
  if (!runId && !patch) {
    return value ?? {};
  }

  return mergeJsonObject(value, {
    ...(runId ? { runId } : {}),
    ...patch
  });
}

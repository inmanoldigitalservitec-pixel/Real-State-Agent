const SENSITIVE_KEYS = /authorization|token|secret|api[-_]?key|password/i;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._-]+/gi;

export function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(BEARER_PATTERN, "Bearer [REDACTED]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (SENSITIVE_KEYS.test(key)) {
        return [key, "[REDACTED]"];
      }

      return [key, redactSecrets(entry)];
    })
  );
}

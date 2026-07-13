export function parseApiFailureEnvelope(value: unknown) {
  if (
    isRecord(value) &&
    value.success === false &&
    isRecord(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string" &&
    typeof value.error.retryable === "boolean" &&
    typeof value.error.requiresClarification === "boolean" &&
    typeof value.error.requiresHuman === "boolean"
  ) {
    return {
      success: true as const,
      data: value
    };
  }

  return {
    success: false as const
  };
}

export function parseApiSuccessEnvelope<T>(
  guard: (value: unknown) => value is T,
  value: unknown
) {
  if (
    isRecord(value) &&
    value.success === true &&
    isRecord(value.metadata) &&
    typeof value.metadata.verifiedAt === "string" &&
    guard(value.data)
  ) {
    return {
      success: true as const,
      data: value as {
        success: true;
        data: T;
        metadata: {
          verifiedAt: string;
        };
      }
    };
  }

  return {
    success: false as const
  };
}

export function parseHealthPayload(value: unknown) {
  if (
    isRecord(value) &&
    value.status === "ok" &&
    typeof value.service === "string" &&
    typeof value.timestamp === "string" &&
    typeof value.version === "string"
  ) {
    return {
      success: true as const,
      data: value as {
        status: "ok";
        service: string;
        timestamp: string;
        version: string;
      }
    };
  }

  return {
    success: false as const
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

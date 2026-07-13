export class AgentCoreClientError extends Error {
  readonly code: string;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly requiresClarification: boolean;
  readonly requiresHuman: boolean;
  readonly correlationId: string | undefined;

  constructor(options: {
    message: string;
    code: string;
    status?: number;
    retryable?: boolean;
    requiresClarification?: boolean;
    requiresHuman?: boolean;
    correlationId?: string;
    cause?: unknown;
  }) {
    super(options.message, options.cause ? { cause: options.cause } : undefined);
    this.name = "AgentCoreClientError";
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.requiresClarification = options.requiresClarification ?? false;
    this.requiresHuman = options.requiresHuman ?? false;
    this.correlationId = options.correlationId;
  }
}

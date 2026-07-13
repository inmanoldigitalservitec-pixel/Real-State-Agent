import { parseApiFailureEnvelope, parseApiSuccessEnvelope, parseHealthPayload } from "./envelope.js";
import { requestJson } from "./request.js";
import { AgentCoreClientError } from "./errors.js";
import type {
  ConversationContextClientResult,
  MessageClientResult,
  AssetCategory,
  PluginLogger,
  PropertyDocumentClientResult,
  PropertyMediaClientResult,
  PropertySearchClientInput,
  PropertySearchClientResult,
  ResolveConversationClientInput,
  ResolveConversationClientResult,
  ResolvedAgentCorePluginConfig,
  SaveConversationMessageClientInput,
  UpdateConversationStateClientInput
} from "../types.js";

export class AgentCoreClient {
  constructor(
    private readonly config: ResolvedAgentCorePluginConfig,
    private readonly logger: PluginLogger
  ) {}

  async getHealth(input: { correlationId: string; signal?: AbortSignal }) {
    const { response, body } = await requestJson(this.config, this.logger, {
      path: "/health",
      method: "GET",
      auth: false,
      correlationId: input.correlationId,
      signal: input.signal
    });

    if (!response.ok) {
      const parsedFailure = parseApiFailureEnvelope(body);

      if (parsedFailure.success) {
        throw new AgentCoreClientError({
          message: parsedFailure.data.error.message,
          code: parsedFailure.data.error.code,
          status: response.status,
          retryable: parsedFailure.data.error.retryable,
          requiresClarification: parsedFailure.data.error.requiresClarification,
          requiresHuman: parsedFailure.data.error.requiresHuman,
          correlationId: input.correlationId
        });
      }

      throw new AgentCoreClientError({
        message: `agent-core health check failed with status ${response.status}`,
        code: "EXTERNAL_ERROR",
        status: response.status,
        retryable: response.status >= 500,
        correlationId: input.correlationId
      });
    }

    const parsed = parseHealthPayload(body);

    if (!parsed.success) {
      throw new AgentCoreClientError({
        message: "agent-core health payload did not match the expected schema",
        code: "EXTERNAL_ERROR",
        status: response.status,
        correlationId: input.correlationId
      });
    }

    return parsed.data;
  }

  async resolveConversation(input: {
    payload: ResolveConversationClientInput;
    correlationId: string;
    signal?: AbortSignal;
  }): Promise<ResolveConversationClientResult> {
    const { response, body } = await requestJson(this.config, this.logger, {
      path: "/internal/conversations/resolve",
      method: "POST",
      body: input.payload,
      correlationId: input.correlationId,
      signal: input.signal,
      rawPayload: {
        channel: input.payload.channel,
        hasExternalSessionId: input.payload.externalSessionId.length > 0,
        hasRunId: Boolean(input.payload.metadata?.runId)
      }
    });

    return this.parseEnvelope(response, body, isResolveConversationResult, "resolve conversation", input.correlationId);
  }

  async getConversationContext(input: {
    conversationId: string;
    messageLimit?: number;
    correlationId: string;
    signal?: AbortSignal;
  }): Promise<ConversationContextClientResult> {
    const search = input.messageLimit === undefined ? "" : `?messageLimit=${encodeURIComponent(input.messageLimit)}`;
    const { response, body } = await requestJson(this.config, this.logger, {
      path: `/internal/conversations/${encodeURIComponent(input.conversationId)}/context${search}`,
      method: "GET",
      correlationId: input.correlationId,
      signal: input.signal
    });

    return this.parseEnvelope(response, body, isConversationContext, "load conversation context", input.correlationId);
  }

  async saveConversationMessage(input: {
    payload: SaveConversationMessageClientInput;
    correlationId: string;
    signal?: AbortSignal;
  }): Promise<MessageClientResult> {
    const { conversationId, ...bodyPayload } = input.payload;
    const { response, body } = await requestJson(this.config, this.logger, {
      path: `/internal/conversations/${encodeURIComponent(conversationId)}/messages`,
      method: "POST",
      body: bodyPayload,
      correlationId: input.correlationId,
      signal: input.signal,
      rawPayload: {
        role: input.payload.role,
        salesStage: input.payload.salesStage,
        hasClientMessageId: Boolean(input.payload.clientMessageId),
        contentLength: input.payload.content.length
      }
    });

    return this.parseEnvelope(response, body, isMessageResult, "save conversation message", input.correlationId);
  }

  async updateConversationState(input: {
    payload: UpdateConversationStateClientInput;
    correlationId: string;
    signal?: AbortSignal;
  }): Promise<Record<string, unknown>> {
    const { response, body } = await requestJson(this.config, this.logger, {
      path: `/internal/conversations/${encodeURIComponent(input.payload.conversationId)}/state`,
      method: "PATCH",
      body: input.payload.patch,
      correlationId: input.correlationId,
      signal: input.signal,
      rawPayload: {
        patchKeys: Object.keys(input.payload.patch).sort()
      }
    });

    return this.parseEnvelope(response, body, isRecord, "update conversation state", input.correlationId);
  }

  async searchProperties(input: {
    payload: PropertySearchClientInput;
    correlationId: string;
    signal?: AbortSignal;
  }): Promise<PropertySearchClientResult[]> {
    const { response, body } = await requestJson(this.config, this.logger, {
      path: "/internal/properties/search",
      method: "POST",
      body: input.payload,
      correlationId: input.correlationId,
      signal: input.signal,
      rawPayload: {
        filterKeys: Object.keys(input.payload)
          .filter((key) => key !== "companyId")
          .sort(),
        limit: input.payload.limit ?? null
      }
    });

    return this.parseEnvelope(
      response,
      body,
      isPropertySearchResults,
      "search properties",
      input.correlationId
    );
  }


  async getPropertyMedia(input: {
    propertyId: string;
    unitId?: string;
    categories?: AssetCategory[];
    limit?: number;
    correlationId: string;
    signal?: AbortSignal;
  }): Promise<PropertyMediaClientResult[]> {
    const { response, body } = await requestJson(this.config, this.logger, {
      path: `/internal/properties/${encodeURIComponent(input.propertyId)}/media`,
      method: "POST",
      body: {
        ...(input.unitId ? { unitId: input.unitId } : {}),
        ...(input.categories?.length ? { categories: input.categories } : {}),
        ...(input.limit ? { limit: input.limit } : {})
      },
      correlationId: input.correlationId,
      signal: input.signal,
      rawPayload: {
        hasUnitId: Boolean(input.unitId),
        categories: input.categories ?? [],
        limit: input.limit ?? null
      }
    });

    return this.parseEnvelope(
      response,
      body,
      isPropertyMediaResults,
      "load property media",
      input.correlationId
    );
  }

  async getPropertyDocuments(input: {
    propertyId: string;
    unitId?: string;
    categories?: AssetCategory[];
    correlationId: string;
    signal?: AbortSignal;
  }): Promise<PropertyDocumentClientResult[]> {
    const { response, body } = await requestJson(this.config, this.logger, {
      path: `/internal/properties/${encodeURIComponent(input.propertyId)}/documents`,
      method: "POST",
      body: {
        ...(input.unitId ? { unitId: input.unitId } : {}),
        ...(input.categories?.length ? { categories: input.categories } : {})
      },
      correlationId: input.correlationId,
      signal: input.signal,
      rawPayload: {
        hasUnitId: Boolean(input.unitId),
        categories: input.categories ?? []
      }
    });

    return this.parseEnvelope(
      response,
      body,
      isPropertyDocumentResults,
      "load property documents",
      input.correlationId
    );
  }

  private parseEnvelope<T>(
    response: Response,
    body: unknown,
    guard: (value: unknown) => value is T,
    operation: string,
    correlationId: string
  ): T {
    if (!response.ok) {
      const parsedFailure = parseApiFailureEnvelope(body);

      if (parsedFailure.success) {
        throw new AgentCoreClientError({
          message: parsedFailure.data.error.message,
          code: parsedFailure.data.error.code,
          status: response.status,
          retryable: parsedFailure.data.error.retryable,
          requiresClarification: parsedFailure.data.error.requiresClarification,
          requiresHuman: parsedFailure.data.error.requiresHuman,
          correlationId
        });
      }

      throw new AgentCoreClientError({
        message: `agent-core ${operation} failed with status ${response.status}`,
        code: "EXTERNAL_ERROR",
        status: response.status,
        retryable: response.status >= 500,
        correlationId
      });
    }

    const parsed = parseApiSuccessEnvelope(guard, body);

    if (!parsed.success) {
      throw new AgentCoreClientError({
        message: `agent-core ${operation} payload did not match the expected schema`,
        code: "EXTERNAL_ERROR",
        status: response.status,
        correlationId
      });
    }

    return parsed.data.data;
  }
}

function isResolveConversationResult(value: unknown): value is ResolveConversationClientResult {
  return (
    isRecord(value) &&
    typeof value.conversationId === "string" &&
    typeof value.companyId === "string" &&
    typeof value.currentSalesStage === "string" &&
    typeof value.memoryVersion === "number" &&
    typeof value.created === "boolean"
  );
}

function isConversationContext(value: unknown): value is ConversationContextClientResult {
  return (
    isRecord(value) &&
    typeof value.conversationId === "string" &&
    typeof value.currentSalesStage === "string" &&
    (value.memory === null || isRecord(value.memory)) &&
    Array.isArray(value.messages)
  );
}

function isMessageResult(value: unknown): value is MessageClientResult {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.conversationId === "string" &&
    typeof value.companyId === "string" &&
    typeof value.role === "string" &&
    typeof value.content === "string" &&
    (value.salesStage === null || typeof value.salesStage === "string") &&
    (value.toolName === null || typeof value.toolName === "string") &&
    typeof value.createdAt === "string"
  );
}


function isPropertyMediaResults(value: unknown): value is PropertyMediaClientResult[] {
  return Array.isArray(value) && value.every(isPropertyMediaResult);
}

function isPropertyMediaResult(value: unknown): value is PropertyMediaClientResult {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    (value.altText === null || typeof value.altText === "string") &&
    (value.caption === null || typeof value.caption === "string") &&
    (value.publicUrl === null || typeof value.publicUrl === "string") &&
    (value.mimeType === null || typeof value.mimeType === "string") &&
    typeof value.sortOrder === "number" &&
    (value.verifiedAt === null || typeof value.verifiedAt === "string")
  );
}

function isPropertyDocumentResults(value: unknown): value is PropertyDocumentClientResult[] {
  return Array.isArray(value) && value.every(isPropertyDocumentResult);
}

function isPropertyDocumentResult(value: unknown): value is PropertyDocumentClientResult {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    typeof value.title === "string" &&
    (value.publicUrl === null || typeof value.publicUrl === "string") &&
    (value.mimeType === null || typeof value.mimeType === "string") &&
    typeof value.sortOrder === "number" &&
    (value.expiresAt === null || typeof value.expiresAt === "string") &&
    (value.verifiedAt === null || typeof value.verifiedAt === "string")
  );
}

function isPropertySearchResults(value: unknown): value is PropertySearchClientResult[] {
  return Array.isArray(value) && value.every(isPropertySearchResult);
}

function isPropertySearchResult(value: unknown): value is PropertySearchClientResult {
  return (
    isRecord(value) &&
    typeof value.propertyId === "string" &&
    typeof value.propertyCode === "string" &&
    typeof value.propertyName === "string" &&
    typeof value.propertyType === "string" &&
    typeof value.developmentId === "string" &&
    typeof value.developmentName === "string" &&
    typeof value.locationLabel === "string" &&
    (value.sector === null || typeof value.sector === "string") &&
    typeof value.city === "string" &&
    (value.bedrooms === null || typeof value.bedrooms === "number") &&
    (value.bathrooms === null || typeof value.bathrooms === "number") &&
    (value.parkingSpaces === null || typeof value.parkingSpaces === "number") &&
    (value.areaFromM2 === null || typeof value.areaFromM2 === "number") &&
    (value.areaToM2 === null || typeof value.areaToM2 === "number") &&
    (value.priceFrom === null || typeof value.priceFrom === "number") &&
    (value.priceTo === null || typeof value.priceTo === "number") &&
    typeof value.currency === "string" &&
    (value.summary === null || typeof value.summary === "string") &&
    Array.isArray(value.features) &&
    value.features.every((feature) => typeof feature === "string") &&
    (value.coverImageUrl === null || typeof value.coverImageUrl === "string") &&
    typeof value.availableUnits === "number" &&
    (value.lastVerifiedAt === null || typeof value.lastVerifiedAt === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

import type {
  AnyAgentTool,
  ToolPluginExecutionContext,
  ToolPluginFactoryContext
} from "openclaw/plugin-sdk/tool-plugin";
import { AgentCoreClient } from "../client/agent-core-client.js";
import { AgentCoreClientError } from "../client/errors.js";
import {
  loadTrustedConversationContext,
  resolveTrustedConversation,
  saveTrustedConversationMessage
} from "../conversation.js";
import { resolvePluginConfig } from "../config.js";
import { buildTrustedToolFactoryContext, withToolCallId } from "../context.js";
import { createCorrelationId } from "../telemetry/correlation.js";
import { createLogger } from "../telemetry/logger.js";
import type {
  AgentCorePluginConfig,
  ConversationContextClientResult,
  PluginLogger,
  PropertyAvailability,
  PropertySearchClientInput,
  PropertySearchClientResult,
  PropertyType,
  SearchPropertiesToolParams,
  SearchPropertiesToolResult,
  TrustedToolFactoryContext,
  TrustedToolContext
} from "../types.js";

const DEFAULT_VISIBLE_RESULTS = 3;
const MAX_VISIBLE_RESULTS = 10;
const REAL_ESTATE_AGENT_ID = "real-estate-agent";

const propertyTypes = [
  "apartment",
  "penthouse",
  "villa",
  "townhouse",
  "studio",
  "commercial",
  "office",
  "land"
] as const;
const availabilityValues = ["available", "reserved", "sold", "unavailable", "hold"] as const;
const allowedKeys = new Set([
  "location",
  "sector",
  "city",
  "bedrooms",
  "bathrooms",
  "parkingSpaces",
  "minimumPrice",
  "maximumPrice",
  "currency",
  "propertyType",
  "amenities",
  "availability",
  "limit"
]);
const blockedKeys = new Set([
  "companyId",
  "conversationId",
  "sessionKey",
  "sessionId",
  "agentId",
  "toolCallId",
  "baseUrl",
  "token",
  "correlationId",
  "propertyId",
  "developmentId",
  "listingId",
  "unitId"
]);

export const searchPropertiesParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    location: {
      type: "string",
      minLength: 1,
      description:
        'Use for natural-language or broad geographic searches, including zones, sectors and the wider Santo Domingo area. When the user says only "Santo Domingo", send location: "Santo Domingo" so the search can include Distrito Nacional, Santo Domingo Este, Santo Domingo Norte and Santo Domingo Oeste. Also use for places such as Villa Mella, Kennedy and Ensanche Ozama.'
    },
    sector: { type: "string", minLength: 1 },
    city: {
      type: "string",
      minLength: 1,
      description:
        'Use only for an exact geographic restriction explicitly requested by the user, such as "Santo Domingo Este", "Santo Domingo Norte", "Santo Domingo Oeste" or "Distrito Nacional". Do not use city: "Santo Domingo" when the user says only "Santo Domingo"; use location instead.'
    },
    bedrooms: { type: "number", minimum: 0 },
    bathrooms: { type: "number", minimum: 0 },
    parkingSpaces: { type: "number", minimum: 0 },
    minimumPrice: { type: "number", minimum: 0 },
    maximumPrice: { type: "number", minimum: 0 },
    currency: { type: "string", minLength: 1 },
    propertyType: { type: "string", enum: propertyTypes },
    amenities: {
      type: "array",
      items: { type: "string", minLength: 1 }
    },
    availability: { type: "string", enum: availabilityValues },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: MAX_VISIBLE_RESULTS,
      default: DEFAULT_VISIBLE_RESULTS
    }
  }
} as const;

export const searchPropertiesDescription = [
  "Search real inventory through agent-core when the customer asks for property options.",
  "Use remembered preferences from the conversation and ask one clarifying question only when the search would be too ambiguous.",
  'Use location for broad natural-language geography. A plain request for "Santo Domingo" must use location, not city. Use city only for exact geographic restrictions.',
  "Returns 3 options by default and up to 10 when the user explicitly requests all available properties.",
  "Each result includes an internal propertyId for follow-up calls to get_property_assets and may include a coverImageUrl for the first visual presentation.",
  "Use propertyId with get_property_assets when the customer asks for photos, brochure, floor plan, amenities, price documents, payment plans, or more information about a specific property.",
  "Do not invent properties, and never expose propertyId or other technical ids to the customer.",
  "Do not use this tool to confirm a specific unit; availableUnits is only a general count."
].join(" ");

export async function executeSearchProperties(
  params: SearchPropertiesToolParams | Record<string, unknown> | undefined,
  rawConfig: AgentCorePluginConfig | undefined,
  trustedContext: TrustedToolContext,
  context: ToolPluginExecutionContext
): Promise<SearchPropertiesToolResult> {
  context.signal?.throwIfAborted?.();

  const logger = createLogger(context.api.logger);
  logger.info("search_properties trusted context resolved", {
    agentIdSource: trustedContext.agentIdSource,
    hasSessionKey: Boolean(trustedContext.sessionKey),
    toolCallId: trustedContext.toolCallId
  });
  ensureRealEstateAgent(trustedContext);

  const normalizedParams = validateSearchPropertiesParams(params ?? {});
  const resolvedConfig = resolvePluginConfig(rawConfig);
  const client = new AgentCoreClient(resolvedConfig, logger);
  const conversation = await resolveTrustedConversation(rawConfig, context, trustedContext);
  const conversationContext = await loadTrustedConversationContext({
    rawConfig,
    context,
    trustedContext,
    conversationId: conversation.conversationId,
    messageLimit: 10
  });

  const runtimeUserMessage = extractRuntimeUserMessage(context);

  if (runtimeUserMessage) {
    await saveTrustedConversationMessage({
      rawConfig,
      context,
      trustedContext,
      conversation,
      message: {
        role: "user",
        content: runtimeUserMessage,
        salesStage: conversationContext.currentSalesStage
      }
    });
  } else {
    logger.debug("search_properties did not persist a user message because the runtime text was unavailable", {
      toolCallId: trustedContext.toolCallId
    });
  }

  const appliedFilters = mergeSearchFilters(normalizedParams, conversationContext);
  const searchPayload = pruneUndefined({
    ...appliedFilters,
    companyId: conversation.companyId,
    limit: appliedFilters.limit ?? DEFAULT_VISIBLE_RESULTS
  }) as PropertySearchClientInput;
  const searchCorrelationId = createCorrelationId("search_properties", trustedContext.agentId);
  const searchResults = await client.searchProperties({
    payload: searchPayload,
    correlationId: searchCorrelationId,
    signal: context.signal
  });
  const compactResults = searchResults.slice(0, appliedFilters.limit ?? DEFAULT_VISIBLE_RESULTS).map(compactPropertySearchResult);
  const statePatch = createSearchStatePatch(appliedFilters, compactResults.map((result) => result.propertyId));
  const stateCorrelationId = createCorrelationId("search_properties_state", trustedContext.agentId);

  await client.updateConversationState({
    payload: {
      conversationId: conversation.conversationId,
      patch: statePatch
    },
    correlationId: stateCorrelationId,
    signal: context.signal
  });

  logger.info("search_properties completed", {
    toolCallId: trustedContext.toolCallId,
    resultCount: compactResults.length,
    filterKeys: Object.keys(appliedFilters).sort()
  });

  return {
    ok: true,
    zeroResults: compactResults.length === 0,
    appliedFilters,
    results: compactResults
  };
}

export function createSearchPropertiesToolFactory(
  factoryContext: ToolPluginFactoryContext<AgentCorePluginConfig | Record<string, unknown>>
): AnyAgentTool | null {
  const pluginConfigResolution = resolveFactoryPluginConfig(factoryContext);
  const logger = createLogger(factoryContext.api.logger);
  let trustedFactoryContext: TrustedToolFactoryContext;

  try {
    trustedFactoryContext = buildTrustedToolFactoryContext(factoryContext.toolContext);
  } catch (error) {
    logger.warn("search_properties factory rejected inconsistent trusted context", {
      agentIdSource: "unavailable",
      hasSessionKey: Boolean(factoryContext.toolContext.sessionKey),
      toolCallId: undefined
    });
    return null;
  }

  if (trustedFactoryContext.agentId !== REAL_ESTATE_AGENT_ID) {
    logger.warn("search_properties factory rejected non-real-estate agent", {
      agentIdSource: trustedFactoryContext.agentIdSource,
      hasSessionKey: Boolean(trustedFactoryContext.sessionKey),
      toolCallId: undefined
    });
    return null;
  }

  return {
    name: "search_properties",
    label: "Search Properties",
    description: searchPropertiesDescription,
    parameters: searchPropertiesParamsSchema,
    async execute(toolCallId, params, signal) {
      const trustedContext = withToolCallId(trustedFactoryContext, toolCallId);

      logger.info(
        `search_properties private config resolved source=${pluginConfigResolution.source} hasCompanyId=${String(pluginConfigResolution.hasCompanyId)}`
      );

      let result: SearchPropertiesToolResult;

      try {
        result = await executeSearchProperties(
          (params ?? {}) as Record<string, unknown>,
          pluginConfigResolution.config,
          trustedContext,
          {
            api: factoryContext.api,
            toolCallId,
            signal
          }
        );
      } catch (error) {
        logger.warn(formatToolExecutionErrorLog(error));
        throw error;
      }

      return {
        content: [
          {
            type: "text",
            text: formatSearchPropertiesToolContent(result)
          }
        ],
        details: result
      };
    }
  };
}

type FactoryPluginConfigResolution = {
  config: AgentCorePluginConfig | Record<string, unknown>;
  source: "factory" | "runtimeConfig" | "unavailable";
  hasCompanyId: boolean;
};

export function resolveFactoryPluginConfig(
  factoryContext: ToolPluginFactoryContext<AgentCorePluginConfig | Record<string, unknown>>
): FactoryPluginConfigResolution {
  const directConfig = isRecord(factoryContext.config) ? factoryContext.config : {};

  if (hasPluginCompanyConfig(directConfig)) {
    return {
      config: directConfig,
      source: "factory",
      hasCompanyId: true
    };
  }

  const runtimeConfig = factoryContext.toolContext.getRuntimeConfig?.() ?? factoryContext.toolContext.config;
  const pluginConfig = readRealEstateToolsPluginConfig(runtimeConfig);
  const mergedConfig = pluginConfig ? { ...directConfig, ...pluginConfig } : directConfig;

  return {
    config: mergedConfig,
    source: pluginConfig ? "runtimeConfig" : "unavailable",
    hasCompanyId: hasPluginCompanyConfig(mergedConfig)
  };
}

function readRealEstateToolsPluginConfig(runtimeConfig: unknown) {
  if (!isRecord(runtimeConfig)) {
    return undefined;
  }

  const plugins = runtimeConfig.plugins;
  if (!isRecord(plugins)) {
    return undefined;
  }

  const entries = plugins.entries;
  if (!isRecord(entries)) {
    return undefined;
  }

  const pluginEntry = entries["real-estate-tools"];
  if (!isRecord(pluginEntry) || !isRecord(pluginEntry.config)) {
    return undefined;
  }

  return pluginEntry.config;
}

function hasPluginCompanyConfig(config: Record<string, unknown>) {
  return typeof config.companyId === "string" && config.companyId.trim().length > 0;
}

function formatToolExecutionErrorLog(error: unknown) {
  const details = serializeToolExecutionError(error);

  return [
    "search_properties execution failed",
    `name=${details.name ?? "unknown"}`,
    `code=${details.code ?? "unknown"}`,
    `status=${details.status ?? "unknown"}`,
    `retryable=${details.retryable ?? "unknown"}`,
    `requiresClarification=${details.requiresClarification ?? "unknown"}`
  ].join(" ");
}

function serializeToolExecutionError(error: unknown) {
  if (!isRecord(error)) {
    return {
      name: typeof error
    };
  }

  return pruneUndefined({
    name: typeof error.name === "string" ? error.name : undefined,
    code: typeof error.code === "string" ? error.code : undefined,
    status: typeof error.status === "number" ? error.status : undefined,
    retryable: typeof error.retryable === "boolean" ? error.retryable : undefined,
    requiresClarification: typeof error.requiresClarification === "boolean" ? error.requiresClarification : undefined
  });
}

function formatSearchPropertiesToolContent(result: SearchPropertiesToolResult) {
  if (result.zeroResults) {
    return JSON.stringify({
      ok: true,
      zeroResults: true,
      appliedFilters: result.appliedFilters,
      results: []
    });
  }

  return JSON.stringify({
    ok: true,
    zeroResults: false,
    appliedFilters: result.appliedFilters,
    results: result.results.map((property) => ({
      propertyId: property.propertyId,
      name: property.name,
      project: property.project,
      location: property.location,
      sector: property.sector,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      areaFromM2: property.areaFromM2,
      areaToM2: property.areaToM2,
      priceFrom: property.priceFrom,
      priceTo: property.priceTo,
      currency: property.currency,
      availableUnits: property.availableUnits,
      coverImageUrl: property.coverImageUrl,
      summary: property.summary,
      features: property.features
    }))
  });
}

export function validateSearchPropertiesParams(value: unknown): SearchPropertiesToolParams {
  if (!isRecord(value)) {
    throw validationError("search_properties expects an object");
  }

  const output: SearchPropertiesToolParams = {};

  for (const key of Object.keys(value)) {
    if (blockedKeys.has(key) || !allowedKeys.has(key)) {
      throw validationError(`search_properties does not accept ${key}`);
    }
  }

  output.location = readTrimmedString(value.location, "location");
  output.sector = readTrimmedString(value.sector, "sector");
  output.city = readTrimmedString(value.city, "city");
  output.bedrooms = readNonnegativeNumber(value.bedrooms, "bedrooms");
  output.bathrooms = readNonnegativeNumber(value.bathrooms, "bathrooms");
  output.parkingSpaces = readNonnegativeNumber(value.parkingSpaces, "parkingSpaces");
  output.minimumPrice = readNonnegativeNumber(value.minimumPrice, "minimumPrice");
  output.maximumPrice = readNonnegativeNumber(value.maximumPrice, "maximumPrice");
  output.currency = readTrimmedString(value.currency, "currency");
  output.propertyType = readEnum(value.propertyType, propertyTypes, "propertyType");
  output.amenities = readStringArray(value.amenities, "amenities");
  output.availability = readEnum(value.availability, availabilityValues, "availability");
  output.limit = readLimit(value.limit);

  return pruneUndefined(output) as SearchPropertiesToolParams;
}

export function mergeSearchFilters(
  args: SearchPropertiesToolParams,
  conversationContext: ConversationContextClientResult
): SearchPropertiesToolParams {
  const memory = conversationContext.memory ?? {};
  const memoryLocation = readFirstString(memory.preferredLocations);
  const memoryAmenities = readMemoryStringArray(memory.importantAmenities);
  const memoryPropertyType = readFirstEnum(memory.propertyTypes, propertyTypes);
  const merged = pruneUndefined({
    location: args.location ?? memoryLocation,
    sector: args.sector,
    city: args.city,
    bedrooms: args.bedrooms ?? readMemoryNumber(memory.bedrooms),
    bathrooms: args.bathrooms ?? readMemoryNumber(memory.bathrooms),
    parkingSpaces: args.parkingSpaces ?? readMemoryNumber(memory.parkingSpaces),
    minimumPrice: args.minimumPrice,
    maximumPrice: args.maximumPrice ?? readMemoryNumber(memory.maximumBudget),
    currency: args.currency ?? readTrimmedMemoryString(memory.currency),
    propertyType: args.propertyType ?? memoryPropertyType,
    amenities: args.amenities ?? memoryAmenities,
    availability: args.availability,
    limit: args.limit ?? DEFAULT_VISIBLE_RESULTS
  }) as SearchPropertiesToolParams;

  return merged;
}

function createSearchStatePatch(appliedFilters: SearchPropertiesToolParams, propertyIds: string[]) {
  const hasResults = propertyIds.length > 0;

  return pruneUndefined({
    preferredLocations: appliedFilters.location ? [appliedFilters.location] : undefined,
    bedrooms: appliedFilters.bedrooms,
    bathrooms: appliedFilters.bathrooms,
    parkingSpaces: appliedFilters.parkingSpaces,
    propertyTypes: appliedFilters.propertyType ? [appliedFilters.propertyType] : undefined,
    maximumBudget: appliedFilters.maximumPrice,
    currency: appliedFilters.currency,
    importantAmenities: appliedFilters.amenities?.length ? appliedFilters.amenities : undefined,
    recommendedPropertyIds: hasResults ? propertyIds : undefined,
    recentPropertyIds: hasResults ? propertyIds : undefined,
    lastCustomerIntent: "property_search",
    salesStage: hasResults ? "RECOMMENDATION" : "DISCOVERY"
  });
}

function compactPropertySearchResult(result: PropertySearchClientResult, index: number) {
  return {
    index: index + 1,
    propertyId: result.propertyId,
    name: result.propertyName,
    project: result.developmentName,
    location: result.locationLabel,
    sector: result.sector,
    city: result.city,
    bedrooms: result.bedrooms,
    bathrooms: result.bathrooms,
    parkingSpaces: result.parkingSpaces,
    areaFromM2: result.areaFromM2,
    areaToM2: result.areaToM2,
    priceFrom: result.priceFrom,
    priceTo: result.priceTo,
    currency: result.currency,
    availableUnits: result.availableUnits,
    coverImageUrl: result.coverImageUrl,
    summary: result.summary,
    features: result.features
  };
}

function ensureRealEstateAgent(context: TrustedToolContext) {
  if (context.agentId !== REAL_ESTATE_AGENT_ID) {
    throw new AgentCoreClientError({
      message: "search_properties is only available to real-estate-agent",
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }
}

function extractRuntimeUserMessage(context: ToolPluginExecutionContext) {
  const api = context.api as Record<string, unknown>;
  const runContext = (api.runContext ?? {}) as Record<string, unknown>;
  const toolContext = (runContext.toolContext ?? {}) as Record<string, unknown>;

  return (
    readTrimmedMemoryString(api.userMessage) ??
    readTrimmedMemoryString(api.prompt) ??
    readTrimmedMemoryString(runContext.userMessage) ??
    readTrimmedMemoryString(runContext.prompt) ??
    readTrimmedMemoryString(toolContext.userMessage) ??
    readTrimmedMemoryString(toolContext.prompt)
  );
}

function readTrimmedString(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw validationError(`${field} must be a string`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw validationError(`${field} cannot be empty`);
  }

  return trimmed;
}

function readTrimmedMemoryString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readNonnegativeNumber(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw validationError(`${field} must be a nonnegative number`);
  }

  return value;
}

function readMemoryNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function readLimit(value: unknown): number {
  if (value === undefined) {
    return DEFAULT_VISIBLE_RESULTS;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_VISIBLE_RESULTS) {
    throw validationError(`limit must be an integer between 1 and ${MAX_VISIBLE_RESULTS}`);
  }

  return value;
}

function readEnum<T extends readonly string[]>(value: unknown, options: T, field: string): T[number] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !options.includes(value)) {
    throw validationError(`${field} must be one of ${options.join(", ")}`);
  }

  return value as T[number];
}

function readFirstEnum<T extends readonly string[]>(value: unknown, options: T): T[number] | undefined {
  const first = readFirstString(value);

  return first && options.includes(first) ? (first as T[number]) : undefined;
}

function readStringArray(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw validationError(`${field} must be an array of strings`);
  }

  const normalized = value.map((item) => readTrimmedString(item, field)).filter(Boolean) as string[];

  return normalized.length > 0 ? normalized : undefined;
}

function readMemoryStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .map((item) => readTrimmedMemoryString(item))
    .filter((item): item is string => Boolean(item));

  return normalized.length > 0 ? normalized : undefined;
}

function readFirstString(value: unknown) {
  return Array.isArray(value) ? readTrimmedMemoryString(value[0]) : undefined;
}

function pruneUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function validationError(message: string) {
  return new AgentCoreClientError({
    message,
    code: "VALIDATION_ERROR",
    requiresClarification: false
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

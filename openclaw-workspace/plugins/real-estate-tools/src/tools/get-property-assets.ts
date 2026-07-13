import type {
  AnyAgentTool,
  ToolPluginExecutionContext,
  ToolPluginFactoryContext
} from "openclaw/plugin-sdk/tool-plugin";
import { AgentCoreClient } from "../client/agent-core-client.js";
import { AgentCoreClientError } from "../client/errors.js";
import { resolvePluginConfig } from "../config.js";
import {
  buildTrustedToolFactoryContext,
  withToolCallId
} from "../context.js";
import { createCorrelationId } from "../telemetry/correlation.js";
import { createLogger } from "../telemetry/logger.js";
import type {
  AgentCorePluginConfig,
  AssetCategory,
  GetPropertyAssetsToolParams,
  GetPropertyAssetsToolResult,
  PropertyAssetLink,
  PropertyDocumentClientResult,
  PropertyMediaClientResult,
  TrustedToolContext,
  TrustedToolFactoryContext
} from "../types.js";
import { resolveFactoryPluginConfig } from "./search-properties.js";

const REAL_ESTATE_AGENT_ID = "real-estate-agent";

const IMAGE_CATEGORIES: AssetCategory[] = [
  "cover_image",
  "property_gallery",
  "exterior_gallery",
  "interior_gallery",
  "amenities_gallery",
  "floor_plan",
  "location_map"
];

const DOCUMENT_CATEGORIES: AssetCategory[] = [
  "brochure",
  "floor_plan",
  "price_list",
  "payment_plan",
  "reservation_requirements"
];

const DEFAULT_CATEGORIES: AssetCategory[] = [
  "cover_image",
  "property_gallery",
  "interior_gallery",
  "exterior_gallery",
  "amenities_gallery",
  "floor_plan",
  "brochure",
  "price_list",
  "payment_plan",
  "location_map",
  "reservation_requirements"
];

const CATEGORY_PRIORITY: AssetCategory[] = [
  "cover_image",
  "interior_gallery",
  "floor_plan",
  "brochure",
  "amenities_gallery",
  "exterior_gallery",
  "property_gallery",
  "price_list",
  "payment_plan",
  "location_map",
  "reservation_requirements",
  "video",
  "virtual_tour"
];

export const getPropertyAssetsDescription = [
  "Load useful JPG, PNG, or PDF links for a property after search_properties returns a propertyId.",
  "Always pass the exact requested categories when the customer asks for a specific resource such as brochure, payment_plan, floor_plan, photos, interiors, or amenities.",
  "For mixed requests containing both images and documents, make separate calls by resource family so images cannot consume the result limit before the requested document is returned.",
  "For example, request up to 2 images in one call and the brochure with categories: [brochure] and limit: 1 in another call.",
  "Do not say that a requested resource is unavailable until a category-specific call for that resource returns noAssets.",
  "Use the links proactively to help the customer understand and evaluate the recommended property.",
  "Return at most 3 links per call and never expose the propertyId to the customer."
].join(" ");

export const getPropertyAssetsParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["propertyId"],
  properties: {
    propertyId: {
      type: "string",
      pattern:
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
      description:
        "Internal property UUID returned by search_properties. Never show it to the customer."
    },
    unitId: {
      type: "string",
      pattern:
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    },
    categories: {
      type: "array",
      uniqueItems: true,
      items: {
        type: "string",
        enum: DEFAULT_CATEGORIES
      }
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 3,
      default: 3
    }
  }
} as const;

export async function executeGetPropertyAssets(
  rawParams: Record<string, unknown>,
  rawConfig: AgentCorePluginConfig | Record<string, unknown> | undefined,
  trustedContext: TrustedToolContext,
  context: Pick<ToolPluginExecutionContext, "signal" | "api" | "toolCallId">
): Promise<GetPropertyAssetsToolResult> {
  context.signal?.throwIfAborted?.();
  ensureRealEstateAgent(trustedContext);

  const params = normalizeParams(rawParams);
  const config = resolvePluginConfig(rawConfig);
  const logger = createLogger(context.api.logger);
  const client = new AgentCoreClient(config, logger);

  const requestedCategories = params.categories?.length
    ? params.categories
    : DEFAULT_CATEGORIES;

  const mediaCategories = requestedCategories.filter((category) =>
    IMAGE_CATEGORIES.includes(category)
  );

  const documentCategories = requestedCategories.filter((category) =>
    DOCUMENT_CATEGORIES.includes(category)
  );

  const [media, documents] = await Promise.all([
    mediaCategories.length
      ? client.getPropertyMedia({
          propertyId: params.propertyId,
          unitId: params.unitId,
          categories: mediaCategories,
          limit: 10,
          correlationId: createCorrelationId(
            "get_property_assets_media",
            trustedContext.agentId
          ),
          signal: context.signal
        })
      : Promise.resolve([]),
    documentCategories.length
      ? client.getPropertyDocuments({
          propertyId: params.propertyId,
          unitId: params.unitId,
          categories: documentCategories,
          correlationId: createCorrelationId(
            "get_property_assets_documents",
            trustedContext.agentId
          ),
          signal: context.signal
        })
      : Promise.resolve([])
  ]);

  const assets = mergeAssets(media, documents).slice(0, params.limit ?? 3);

  logger.info("get_property_assets completed", {
    toolCallId: trustedContext.toolCallId,
    mediaCount: media.length,
    documentCount: documents.length,
    returnedCount: assets.length,
    categories: requestedCategories
  });

  return {
    ok: true,
    noAssets: assets.length === 0,
    assets
  };
}

export function createGetPropertyAssetsToolFactory(
  factoryContext: ToolPluginFactoryContext<
    AgentCorePluginConfig | Record<string, unknown>
  >
): AnyAgentTool | null {
  const pluginConfigResolution = resolveFactoryPluginConfig(factoryContext);
  const logger = createLogger(factoryContext.api.logger);
  let trustedFactoryContext: TrustedToolFactoryContext;

  try {
    trustedFactoryContext = buildTrustedToolFactoryContext(
      factoryContext.toolContext
    );
  } catch {
    logger.warn(
      "get_property_assets factory rejected inconsistent trusted context"
    );
    return null;
  }

  if (trustedFactoryContext.agentId !== REAL_ESTATE_AGENT_ID) {
    return null;
  }

  return {
    name: "get_property_assets",
    label: "Get Property Assets",
    description: getPropertyAssetsDescription,
    parameters: getPropertyAssetsParamsSchema,
    async execute(toolCallId, params, signal) {
      const trustedContext = withToolCallId(
        trustedFactoryContext,
        toolCallId
      );

      const result = await executeGetPropertyAssets(
        (params ?? {}) as Record<string, unknown>,
        pluginConfigResolution.config,
        trustedContext,
        {
          api: factoryContext.api,
          toolCallId,
          signal
        }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ],
        details: result
      };
    }
  };
}

function normalizeParams(
  rawParams: Record<string, unknown>
): GetPropertyAssetsToolParams {
  const propertyId = readUuid(rawParams.propertyId, "propertyId");
  const unitId =
    rawParams.unitId === undefined
      ? undefined
      : readUuid(rawParams.unitId, "unitId");

  const categories =
    rawParams.categories === undefined
      ? undefined
      : readCategories(rawParams.categories);

  const limit =
    rawParams.limit === undefined
      ? 3
      : readLimit(rawParams.limit);

  return {
    propertyId,
    unitId,
    categories,
    limit
  };
}

function mergeAssets(
  media: PropertyMediaClientResult[],
  documents: PropertyDocumentClientResult[]
): PropertyAssetLink[] {
  const candidates: Array<PropertyAssetLink & { sortOrder: number }> = [];

  for (const item of media) {
    if (!item.publicUrl) {
      continue;
    }

    const format = detectFormat(item.mimeType, item.publicUrl);

    if (format !== "jpg" && format !== "png") {
      continue;
    }

    candidates.push({
      category: item.category,
      format,
      title:
        cleanText(item.caption) ??
        cleanText(item.altText) ??
        categoryTitle(item.category),
      url: item.publicUrl,
      sortOrder: item.sortOrder
    });
  }

  for (const item of documents) {
    if (!item.publicUrl) {
      continue;
    }

    const format = detectFormat(item.mimeType, item.publicUrl);

    if (format !== "pdf") {
      continue;
    }

    candidates.push({
      category: item.category,
      format,
      title: cleanText(item.title) ?? categoryTitle(item.category),
      url: item.publicUrl,
      sortOrder: item.sortOrder
    });
  }

  const seen = new Set<string>();

  return candidates
    .sort((left, right) => {
      const categoryDifference =
        categoryPriority(left.category) -
        categoryPriority(right.category);

      return categoryDifference || left.sortOrder - right.sortOrder;
    })
    .filter((asset) => {
      if (seen.has(asset.url)) {
        return false;
      }

      seen.add(asset.url);
      return true;
    })
    .map(({ sortOrder: _sortOrder, ...asset }) => asset);
}

function detectFormat(
  mimeType: string | null,
  url: string
): "jpg" | "png" | "pdf" | null {
  const mime = mimeType?.toLowerCase() ?? "";
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();

  if (
    mime === "image/jpeg" ||
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg")
  ) {
    return "jpg";
  }

  if (mime === "image/png" || cleanUrl.endsWith(".png")) {
    return "png";
  }

  if (mime === "application/pdf" || cleanUrl.endsWith(".pdf")) {
    return "pdf";
  }

  return null;
}

function categoryPriority(category: AssetCategory) {
  const index = CATEGORY_PRIORITY.indexOf(category);
  return index === -1 ? CATEGORY_PRIORITY.length : index;
}

function categoryTitle(category: AssetCategory) {
  const titles: Partial<Record<AssetCategory, string>> = {
    cover_image: "Vista principal",
    property_gallery: "Galería de la propiedad",
    exterior_gallery: "Vista exterior",
    interior_gallery: "Vista interior",
    amenities_gallery: "Amenidades",
    floor_plan: "Plano de distribución",
    brochure: "Brochure del proyecto",
    payment_plan: "Plan de pago",
    price_list: "Lista de precios",
    location_map: "Mapa de ubicación",
    reservation_requirements: "Requisitos de reserva"
  };

  return titles[category] ?? "Recurso de la propiedad";
}

function cleanText(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readUuid(value: unknown, field: string) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      value
    )
  ) {
    throw new AgentCoreClientError({
      message: `Invalid ${field}`,
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }

  return value;
}

function readCategories(value: unknown): AssetCategory[] {
  if (!Array.isArray(value)) {
    throw new AgentCoreClientError({
      message: "categories must be an array",
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }

  const allowed = new Set(DEFAULT_CATEGORIES);

  const categories = value.filter(
    (item): item is AssetCategory =>
      typeof item === "string" &&
      allowed.has(item as AssetCategory)
  );

  if (categories.length !== value.length) {
    throw new AgentCoreClientError({
      message: "categories contains unsupported values",
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }

  return [...new Set(categories)];
}

function readLimit(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 3
  ) {
    throw new AgentCoreClientError({
      message: "limit must be an integer between 1 and 3",
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }

  return value;
}

function ensureRealEstateAgent(context: TrustedToolContext) {
  if (context.agentId !== REAL_ESTATE_AGENT_ID) {
    throw new AgentCoreClientError({
      message:
        "get_property_assets is only available to real-estate-agent",
      code: "VALIDATION_ERROR",
      requiresClarification: false
    });
  }
}

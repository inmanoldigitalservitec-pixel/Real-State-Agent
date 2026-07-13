export type LogLevel = "debug" | "info" | "warn" | "error";

export type AgentCorePluginConfig = {
  baseUrl?: string;
  internalApiKeyEnvVar?: string;
  companyId?: string;
  channel?: "web";
  timeoutMs?: number;
  logLevel?: LogLevel;
};

export type ResolvedAgentCorePluginConfig = {
  baseUrl: string;
  internalApiKeyEnvVar: string;
  companyId?: string;
  channel: "web";
  timeoutMs: number;
  logLevel: LogLevel;
};

export type AgentCoreRequestMethod = "GET" | "POST" | "PATCH";

export type RequestOptions = {
  path: string;
  method?: AgentCoreRequestMethod;
  body?: unknown;
  auth?: boolean;
  correlationId: string;
  signal?: AbortSignal;
  rawPayload?: Record<string, unknown>;
};

export type TrustedToolContext = {
  agentId?: string;
  agentIdSource: "explicit" | "sessionKey" | "unavailable";
  sessionId?: string;
  sessionKey?: string;
  runId?: string;
  workspaceDir?: string;
  toolCallId: string;
};

export type TrustedToolFactoryContext = Omit<TrustedToolContext, "toolCallId">;

export type PluginLogger = {
  debug: (message: string, payload?: unknown) => void;
  info: (message: string, payload?: unknown) => void;
  warn: (message: string, payload?: unknown) => void;
  error: (message: string, payload?: unknown) => void;
};

export type HealthToolResult = {
  ok: true;
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
  verifiedAt?: string;
  correlationId: string;
};

export type ResolveConversationClientInput = {
  companyId: string;
  channel: "web";
  externalSessionId: string;
  metadata?: {
    runId?: string;
  };
};

export type ResolveConversationClientResult = {
  conversationId: string;
  companyId: string;
  currentSalesStage: string;
  memoryVersion: number;
  created: boolean;
};

export type ConversationContextClientResult = {
  conversationId: string;
  currentSalesStage: string;
  memory: Record<string, unknown> | null;
  messages: Array<{
    role: string;
    content: string;
    salesStage: string | null;
    createdAt: string;
  }>;
};

export type SaveConversationMessageClientInput = {
  conversationId: string;
  companyId: string;
  role: "system" | "assistant" | "user" | "tool" | "human_agent";
  content: string;
  salesStage?: string;
  clientMessageId?: string;
  toolName?: string;
  rawPayload?: Record<string, unknown>;
};

export type MessageClientResult = {
  id: string;
  conversationId: string;
  companyId: string;
  role: string;
  content: string;
  salesStage: string | null;
  toolName: string | null;
  createdAt: string;
};

export type UpdateConversationStateClientInput = {
  conversationId: string;
  patch: Record<string, unknown>;
};

export type PropertySearchClientInput = {
  companyId: string;
  location?: string;
  sector?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  minimumPrice?: number;
  maximumPrice?: number;
  currency?: string;
  propertyType?: PropertyType;
  amenities?: string[];
  availability?: PropertyAvailability;
  limit?: number;
};

export type PropertyType =
  | "apartment"
  | "penthouse"
  | "villa"
  | "townhouse"
  | "studio"
  | "commercial"
  | "office"
  | "land";

export type PropertyAvailability = "available" | "reserved" | "sold" | "unavailable" | "hold";

export type PropertySearchClientResult = {
  propertyId: string;
  propertyCode: string;
  propertyName: string;
  propertyType: string;
  developmentId: string;
  developmentName: string;
  locationLabel: string;
  sector: string | null;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  areaFromM2: number | null;
  areaToM2: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  currency: string;
  summary: string | null;
  features: string[];
  coverImageUrl: string | null;
  availableUnits: number;
  lastVerifiedAt: string | null;
};

export type SearchPropertiesToolParams = {
  location?: string;
  sector?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  minimumPrice?: number;
  maximumPrice?: number;
  currency?: string;
  propertyType?: PropertyType;
  amenities?: string[];
  availability?: PropertyAvailability;
  limit?: number;
};

export type SearchPropertiesToolResult = {
  ok: true;
  zeroResults: boolean;
  appliedFilters: SearchPropertiesToolParams;
  results: Array<{
    index: number;
    propertyId: string;
    name: string;
    project: string;
    location: string;
    sector: string | null;
    city: string;
    bedrooms: number | null;
    bathrooms: number | null;
    parkingSpaces: number | null;
    areaFromM2: number | null;
    areaToM2: number | null;
    priceFrom: number | null;
    priceTo: number | null;
    currency: string;
    availableUnits: number;
    coverImageUrl: string | null;
    summary: string | null;
    features: string[];
  }>;
};


export type AssetCategory =
  | "cover_image"
  | "property_gallery"
  | "exterior_gallery"
  | "interior_gallery"
  | "amenities_gallery"
  | "floor_plan"
  | "video"
  | "virtual_tour"
  | "brochure"
  | "payment_plan"
  | "price_list"
  | "location_map"
  | "reservation_requirements";

export type PropertyMediaClientResult = {
  id: string;
  category: AssetCategory;
  altText: string | null;
  caption: string | null;
  publicUrl: string | null;
  mimeType: string | null;
  sortOrder: number;
  verifiedAt: string | null;
};

export type PropertyDocumentClientResult = {
  id: string;
  category: AssetCategory;
  title: string;
  publicUrl: string | null;
  mimeType: string | null;
  sortOrder: number;
  expiresAt: string | null;
  verifiedAt: string | null;
};

export type GetPropertyAssetsToolParams = {
  propertyId: string;
  unitId?: string;
  categories?: AssetCategory[];
  limit?: number;
};

export type PropertyAssetLink = {
  category: AssetCategory;
  format: "jpg" | "png" | "pdf";
  title: string;
  url: string;
};

export type GetPropertyAssetsToolResult = {
  ok: true;
  noAssets: boolean;
  assets: PropertyAssetLink[];
};

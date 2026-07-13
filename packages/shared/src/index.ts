import { z } from "zod";

export const salesStages = [
  "NEW",
  "INQUIRY",
  "DISCOVERY",
  "RECOMMENDATION",
  "PROPERTY_INTEREST",
  "EVALUATION",
  "HIGH_INTENT",
  "VISIT_REQUESTED",
  "HUMAN_HANDOFF",
  "CLOSED"
] as const;

export const salesStageSchema = z.enum(salesStages);
export type SalesStage = z.infer<typeof salesStageSchema>;

export const assetCategoryValues = [
  "cover_image",
  "property_gallery",
  "exterior_gallery",
  "interior_gallery",
  "amenities_gallery",
  "floor_plan",
  "video",
  "virtual_tour",
  "brochure",
  "payment_plan",
  "price_list",
  "location_map",
  "reservation_requirements"
] as const;

export const assetCategorySchema = z.enum(assetCategoryValues);
export type AssetCategory = z.infer<typeof assetCategorySchema>;

export const propertyTypeValues = [
  "apartment",
  "penthouse",
  "villa",
  "townhouse",
  "studio",
  "commercial",
  "office",
  "land"
] as const;

export const propertyTypeSchema = z.enum(propertyTypeValues);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const leadTemperatureValues = ["cold", "warm", "hot"] as const;
export const leadTemperatureSchema = z.enum(leadTemperatureValues);
export type LeadTemperature = z.infer<typeof leadTemperatureSchema>;

export const handoffReasonValues = [
  "requested_by_customer",
  "discount_request",
  "negotiation",
  "reservation",
  "legal_question",
  "financial_question",
  "complaint",
  "visit_request",
  "high_intent",
  "unknown"
] as const;

export const handoffReasonSchema = z.enum(handoffReasonValues);
export type HandoffReason = z.infer<typeof handoffReasonSchema>;

export const messageRoleValues = ["system", "assistant", "user", "tool", "human_agent"] as const;
export const messageRoleSchema = z.enum(messageRoleValues);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const conversationChannelValues = ["web"] as const;
export const conversationChannelSchema = z.enum(conversationChannelValues);
export type ConversationChannel = z.infer<typeof conversationChannelSchema>;

export const uuidSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, "Invalid UUID");
export const isoDatetimeSchema = z.string().datetime({ offset: true });
export const optionalTrimmedString = z.string().trim().min(1).optional();

export const healthPayloadSchema = z.object({
  status: z.literal("ok"),
  service: z.enum(["agent-core", "web-chat", "shared"]),
  timestamp: isoDatetimeSchema,
  version: z.string()
});

export type HealthPayload = z.infer<typeof healthPayloadSchema>;

export const appMetadata = {
  name: "Real State Agent",
  version: "0.1.0",
  agentCorePort: 8787,
  webChatPort: 5173
} as const;

export const projectLayout = [
  "apps/agent-core",
  "apps/web-chat",
  "packages/shared",
  "openclaw-workspace",
  "supabase"
] as const;

export function createHealthPayload(service: HealthPayload["service"]): HealthPayload {
  return {
    status: "ok",
    service,
    timestamp: new Date().toISOString(),
    version: appMetadata.version
  };
}

export const serviceErrorCodeValues = [
  "UNAUTHORIZED",
  "CONFIGURATION_ERROR",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "CONFLICT",
  "DATABASE_ERROR",
  "EXTERNAL_ERROR",
  "UNEXPECTED_ERROR"
] as const;

export const serviceErrorSchema = z.object({
  code: z.enum(serviceErrorCodeValues),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  cause: z.string().optional()
});

export type ServiceError = z.infer<typeof serviceErrorSchema>;

export const propertySearchInputSchema = z.object({
  companyId: uuidSchema.optional(),
  location: optionalTrimmedString,
  sector: optionalTrimmedString,
  city: optionalTrimmedString,
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  parkingSpaces: z.number().int().nonnegative().optional(),
  minimumPrice: z.number().nonnegative().optional(),
  maximumPrice: z.number().nonnegative().optional(),
  currency: z.string().trim().min(1).optional(),
  propertyType: propertyTypeSchema.optional(),
  amenities: z.array(z.string().trim().min(1)).optional(),
  availability: z.enum(["available", "reserved", "sold", "unavailable", "hold"]).optional(),
  limit: z.number().int().positive().max(10).default(3)
});

export type PropertySearchInput = z.input<typeof propertySearchInputSchema>;

export const apiFailureSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
    requiresClarification: z.boolean(),
    requiresHuman: z.boolean()
  })
});

export type ApiFailure = z.infer<typeof apiFailureSchema>;

export function createApiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    metadata: z.object({
      verifiedAt: isoDatetimeSchema
    })
  });
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
  metadata: {
    verifiedAt: string;
  };
};

export const propertyIdPathParamsSchema = z.object({
  propertyId: uuidSchema
});

export const companyIdPathParamsSchema = z.object({
  companyId: uuidSchema
});

export const conversationIdPathParamsSchema = z.object({
  conversationId: uuidSchema
});

export const getPropertyDetailsInputSchema = propertyIdPathParamsSchema;
export const checkPropertyAvailabilityInputSchema = propertyIdPathParamsSchema;

export const getPropertyMediaInputSchema = z.object({
  propertyId: uuidSchema,
  unitId: uuidSchema.optional(),
  categories: z.array(assetCategorySchema).optional(),
  limit: z.number().int().positive().max(10).default(10)
});

export const propertySearchResultSchema = z.object({
  propertyId: uuidSchema,
  propertyCode: z.string().nullable(),
  propertyName: z.string(),
  propertyType: propertyTypeSchema,
  developmentId: uuidSchema,
  developmentName: z.string(),
  locationLabel: z.string().nullable(),
  sector: z.string().nullable(),
  city: z.string(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  parkingSpaces: z.number().int().nullable(),
  areaFromM2: z.number().nullable(),
  areaToM2: z.number().nullable(),
  priceFrom: z.number().nullable(),
  priceTo: z.number().nullable(),
  currency: z.string(),
  summary: z.string().nullable(),
  features: z.array(z.string()),
  coverImageUrl: z.string().nullable(),
  availableUnits: z.number().int().nonnegative(),
  lastVerifiedAt: isoDatetimeSchema.nullable()
});

export type PropertySearchResult = z.infer<typeof propertySearchResultSchema>;

export const resolvePropertyReferenceInputSchema = z.object({
  reference: z.string().trim().min(1),
  sourcePropertyId: uuidSchema.optional(),
  sourceListingId: uuidSchema.optional(),
  activePropertyId: uuidSchema.optional(),
  recentPropertyIds: z.array(uuidSchema).optional(),
  companyId: uuidSchema.optional()
});

export type ResolvePropertyReferenceInput = z.input<typeof resolvePropertyReferenceInputSchema>;

export const propertyReferenceResolutionSchema = z.object({
  propertyId: uuidSchema,
  propertyName: z.string(),
  developmentName: z.string(),
  matchReason: z.enum([
    "source_property",
    "active_property",
    "recent_property",
    "listing",
    "search_match"
  ]),
  confidence: z.number().min(0).max(1)
});

export type PropertyReferenceResolution = z.infer<typeof propertyReferenceResolutionSchema>;

export const propertyDetailsSchema = z.object({
  propertyId: uuidSchema,
  propertyName: z.string(),
  propertyCode: z.string().nullable(),
  propertyType: propertyTypeSchema,
  developmentId: uuidSchema,
  developmentName: z.string(),
  developmentStatus: z.string(),
  locationLabel: z.string().nullable(),
  sector: z.string().nullable(),
  city: z.string(),
  deliveryDateEstimate: z.string().nullable(),
  deliveryNotes: z.string().nullable(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  parkingSpaces: z.number().int().nullable(),
  areaFromM2: z.number().nullable(),
  areaToM2: z.number().nullable(),
  priceFrom: z.number().nullable(),
  priceTo: z.number().nullable(),
  currency: z.string(),
  features: z.array(z.string()),
  availableUnits: z.number().int().nonnegative(),
  totalUnits: z.number().int().nonnegative(),
  amenities: z.array(
    z.object({
      id: uuidSchema,
      name: z.string(),
      category: z.string(),
      description: z.string().nullable(),
      isHighlight: z.boolean(),
      scope: z.enum(["development", "property", "unit"])
    })
  )
});

export type PropertyDetails = z.infer<typeof propertyDetailsSchema>;

export const propertyAvailabilityResultSchema = z.object({
  propertyId: uuidSchema,
  available: z.boolean(),
  availableUnits: z.number().int().nonnegative(),
  lastVerifiedAt: isoDatetimeSchema.nullable(),
  units: z.array(
    z.object({
      unitId: uuidSchema,
      unitNumber: z.string(),
      unitCode: z.string().nullable(),
      listPrice: z.number().nullable(),
      currency: z.string(),
      bedrooms: z.number().int().nullable(),
      bathrooms: z.number().int().nullable(),
      parkingSpaces: z.number().int().nullable(),
      totalAreaM2: z.number().nullable(),
      status: z.string()
    })
  )
});

export type PropertyAvailabilityResult = z.infer<typeof propertyAvailabilityResultSchema>;

export const publicPropertyMediaItemSchema = z.object({
  id: uuidSchema,
  category: assetCategorySchema,
  altText: z.string().nullable(),
  caption: z.string().nullable(),
  publicUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
  sortOrder: z.number().int(),
  verifiedAt: isoDatetimeSchema.nullable()
});

export type PublicPropertyMediaItem = z.infer<typeof publicPropertyMediaItemSchema>;

export const propertyMediaItemSchema = z.object({
  id: uuidSchema,
  propertyId: uuidSchema.nullable(),
  developmentId: uuidSchema.nullable(),
  unitId: uuidSchema.nullable(),
  assetType: z.enum(["image", "video", "virtual_tour", "map"]),
  category: assetCategorySchema,
  bucketName: z.string(),
  storagePath: z.string(),
  publicUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
  altText: z.string().nullable(),
  caption: z.string().nullable(),
  sortOrder: z.number().int(),
  isPrimary: z.boolean(),
  lastVerifiedAt: isoDatetimeSchema.nullable()
});

export type PropertyMediaItem = z.infer<typeof propertyMediaItemSchema>;

export const propertyDocumentsInputSchema = z.object({
  propertyId: uuidSchema.optional(),
  developmentId: uuidSchema.optional(),
  unitId: uuidSchema.optional(),
  categories: z
    .array(
      z.enum(["brochure", "floor_plan", "price_list", "reservation_requirements", "payment_plan"])
    )
    .optional()
});

export type PropertyDocumentsInput = z.input<typeof propertyDocumentsInputSchema>;

export const getPaymentPlanInputSchema = z.object({
  propertyId: uuidSchema,
  unitId: uuidSchema.optional()
});

export const propertyDocumentSchema = z.object({
  id: uuidSchema,
  propertyId: uuidSchema.nullable(),
  developmentId: uuidSchema.nullable(),
  unitId: uuidSchema.nullable(),
  category: assetCategorySchema,
  title: z.string(),
  bucketName: z.string(),
  storagePath: z.string(),
  publicUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
  versionLabel: z.string().nullable(),
  expiresAt: z.string().nullable(),
  lastVerifiedAt: isoDatetimeSchema.nullable(),
  sortOrder: z.number().int()
});

export type PropertyDocument = z.infer<typeof propertyDocumentSchema>;

export const publicPropertyDocumentSchema = z.object({
  id: uuidSchema,
  category: assetCategorySchema,
  title: z.string(),
  publicUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
  sortOrder: z.number().int(),
  expiresAt: z.string().nullable(),
  verifiedAt: isoDatetimeSchema.nullable()
});

export type PublicPropertyDocument = z.infer<typeof publicPropertyDocumentSchema>;

export const paymentPlanInstallmentSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  dueLabel: z.string().nullable(),
  dueType: z.string(),
  dueDate: z.string().nullable(),
  daysFromReservation: z.number().int().nullable(),
  percentage: z.number().nullable(),
  amount: z.number().nullable(),
  currency: z.string(),
  sortOrder: z.number().int()
});

export type PaymentPlanInstallment = z.infer<typeof paymentPlanInstallmentSchema>;

export const paymentPlanResultSchema = z.object({
  available: z.boolean(),
  requiresHumanVerification: z.boolean(),
  reason: z.string().nullable(),
  plan: z
    .object({
      id: uuidSchema,
      propertyId: uuidSchema.nullable(),
      developmentId: uuidSchema.nullable(),
      unitId: uuidSchema.nullable(),
      name: z.string(),
      description: z.string().nullable(),
      currency: z.string(),
      validFrom: z.string(),
      validTo: z.string().nullable(),
      lastVerifiedAt: isoDatetimeSchema,
      separationAmount: z.number().nullable(),
      totalInitialAmount: z.number().nullable(),
      totalInitialPercentage: z.number().nullable(),
      notes: z.string().nullable(),
      items: z.array(paymentPlanInstallmentSchema)
    })
    .nullable()
});

export type PaymentPlanResult = z.infer<typeof paymentPlanResultSchema>;

export const companyInformationResultSchema = z.object({
  companyId: uuidSchema,
  slug: z.string(),
  name: z.string(),
  brandName: z.string().nullable(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  whatsappNumber: z.string().nullable(),
  city: z.string().nullable(),
  stateRegion: z.string().nullable(),
  timezone: z.string(),
  faqs: z.array(
    z.object({
      id: uuidSchema,
      category: z.string(),
      question: z.string(),
      answer: z.string(),
      lastVerifiedAt: isoDatetimeSchema.nullable()
    })
  )
});

export type CompanyInformationResult = z.infer<typeof companyInformationResultSchema>;

export const getCompanyInformationInputSchema = companyIdPathParamsSchema;

export const conversationMemorySchema = z.object({
  conversationId: uuidSchema,
  companyId: uuidSchema,
  customerName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  preferredContactMethod: z.string().nullable(),
  preferredLocations: z.array(z.string()),
  rejectedLocations: z.array(z.string()),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  parkingSpaces: z.number().int().nullable(),
  propertyTypes: z.array(z.string()),
  minimumAreaM2: z.number().nullable(),
  maximumBudget: z.number().nullable(),
  currency: z.string().nullable(),
  importantAmenities: z.array(z.string()),
  deliveryPreference: z.string().nullable(),
  purchasePurpose: z.string().nullable(),
  financingRequired: z.boolean().nullable(),
  purchaseTimeline: z.string().nullable(),
  mainObjections: z.array(z.string()),
  leadTemperature: leadTemperatureSchema,
  salesStage: salesStageSchema,
  activePropertyId: uuidSchema.nullable(),
  activePropertyUnitId: uuidSchema.nullable(),
  interestedPropertyIds: z.array(uuidSchema),
  recommendedPropertyIds: z.array(uuidSchema),
  viewedPropertyIds: z.array(uuidSchema),
  rejectedPropertyIds: z.array(uuidSchema),
  recentPropertyIds: z.array(uuidSchema),
  sentAssetIds: z.array(uuidSchema),
  sentBrochureIds: z.array(uuidSchema),
  sentFloorPlanIds: z.array(uuidSchema),
  sentPaymentPlanIds: z.array(uuidSchema),
  lastCustomerIntent: z.string().nullable(),
  lastAgentQuestion: z.string().nullable(),
  pendingQuestion: z.string().nullable(),
  conversationSummary: z.string().nullable(),
  sourceChannel: conversationChannelSchema,
  sourceListingId: uuidSchema.nullable(),
  sourcePropertyId: uuidSchema.nullable(),
  visitRequested: z.boolean(),
  preferredVisitDate: z.string().nullable(),
  preferredVisitTime: z.string().nullable(),
  handoffRequested: z.boolean(),
  handoffReason: handoffReasonSchema.nullable(),
  assignedAgent: z.string().nullable(),
  memoryVersion: z.number().int()
});

export type ConversationMemory = z.infer<typeof conversationMemorySchema>;

export const resolveConversationMetadataSchema = z
  .object({
    runId: z.string().trim().min(1).max(120).optional()
  })
  .strict();

export const resolveConversationInputSchema = z
  .object({
    companyId: uuidSchema,
    channel: conversationChannelSchema,
    externalSessionId: z.string().trim().min(1).max(256),
    sourceListingId: uuidSchema.optional(),
    sourcePropertyId: uuidSchema.optional(),
    sourcePropertyUnitId: uuidSchema.optional(),
    metadata: resolveConversationMetadataSchema.optional()
  })
  .strict();

export type ResolveConversationInput = z.input<typeof resolveConversationInputSchema>;

export const resolveConversationResultSchema = z.object({
  conversationId: uuidSchema,
  companyId: uuidSchema,
  currentSalesStage: salesStageSchema,
  memoryVersion: z.number().int().positive(),
  created: z.boolean()
});

export type ResolveConversationResult = z.infer<typeof resolveConversationResultSchema>;

export const conversationStatePatchSchema = z
  .object({
    customerName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    preferredContactMethod: z.string().nullable().optional(),
    preferredLocations: z.array(z.string()).optional(),
    rejectedLocations: z.array(z.string()).optional(),
    bedrooms: z.number().int().nullable().optional(),
    bathrooms: z.number().int().nullable().optional(),
    parkingSpaces: z.number().int().nullable().optional(),
    propertyTypes: z.array(z.string()).optional(),
    minimumAreaM2: z.number().nullable().optional(),
    maximumBudget: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
    importantAmenities: z.array(z.string()).optional(),
    deliveryPreference: z.string().nullable().optional(),
    purchasePurpose: z.string().nullable().optional(),
    financingRequired: z.boolean().nullable().optional(),
    purchaseTimeline: z.string().nullable().optional(),
    mainObjections: z.array(z.string()).optional(),
    leadTemperature: leadTemperatureSchema.optional(),
    salesStage: salesStageSchema.optional(),
    activePropertyId: uuidSchema.nullable().optional(),
    activePropertyUnitId: uuidSchema.nullable().optional(),
    interestedPropertyIds: z.array(uuidSchema).optional(),
    recommendedPropertyIds: z.array(uuidSchema).optional(),
    viewedPropertyIds: z.array(uuidSchema).optional(),
    rejectedPropertyIds: z.array(uuidSchema).optional(),
    recentPropertyIds: z.array(uuidSchema).optional(),
    sentAssetIds: z.array(uuidSchema).optional(),
    sentBrochureIds: z.array(uuidSchema).optional(),
    sentFloorPlanIds: z.array(uuidSchema).optional(),
    sentPaymentPlanIds: z.array(uuidSchema).optional(),
    lastCustomerIntent: z.string().nullable().optional(),
    lastAgentQuestion: z.string().nullable().optional(),
    pendingQuestion: z.string().nullable().optional(),
    conversationSummary: z.string().nullable().optional(),
    sourceListingId: uuidSchema.nullable().optional(),
    sourcePropertyId: uuidSchema.nullable().optional(),
    visitRequested: z.boolean().optional(),
    preferredVisitDate: z.string().nullable().optional(),
    preferredVisitTime: z.string().nullable().optional(),
    handoffRequested: z.boolean().optional(),
    handoffReason: handoffReasonSchema.nullable().optional(),
    assignedAgent: z.string().nullable().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one state field must be provided");

export type ConversationStatePatch = z.input<typeof conversationStatePatchSchema>;

export const conversationContextResultSchema = z.object({
  conversationId: uuidSchema,
  currentSalesStage: salesStageSchema,
  summary: z.string().nullable(),
  sourceListingId: uuidSchema.nullable(),
  sourcePropertyId: uuidSchema.nullable(),
  sourcePropertyUnitId: uuidSchema.nullable(),
  memory: conversationMemorySchema.nullable(),
  messages: z.array(
    z.object({
      id: uuidSchema,
      role: messageRoleSchema,
      content: z.string(),
      salesStage: salesStageSchema.nullable(),
      toolName: z.string().nullable(),
      assetIds: z.array(uuidSchema),
      createdAt: isoDatetimeSchema
    })
  )
});

export type ConversationContextResult = z.infer<typeof conversationContextResultSchema>;

export const getConversationContextInputSchema = z.object({
  conversationId: uuidSchema,
  messageLimit: z.coerce.number().int().positive().max(50).default(20)
});

export const messageResponseSchema = z.object({
  id: uuidSchema,
  conversationId: uuidSchema,
  companyId: uuidSchema,
  role: messageRoleSchema,
  content: z.string(),
  salesStage: salesStageSchema.nullable(),
  toolName: z.string().nullable(),
  assetIds: z.array(uuidSchema),
  createdAt: isoDatetimeSchema
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const saveMessageInputSchema = z.object({
  conversationId: uuidSchema,
  companyId: uuidSchema,
  role: messageRoleSchema,
  content: z.string().trim().min(1),
  salesStage: salesStageSchema.optional(),
  clientMessageId: z.string().trim().min(1).optional(),
  toolName: z.string().trim().min(1).optional(),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
  uiPayload: z.record(z.string(), z.unknown()).optional(),
  assetIds: z.array(uuidSchema).default([])
});

export type SaveMessageInput = z.input<typeof saveMessageInputSchema>;

export const leadResponseSchema = z.object({
  id: uuidSchema,
  companyId: uuidSchema,
  conversationId: uuidSchema.nullable(),
  sourcePropertyId: uuidSchema.nullable(),
  sourcePropertyUnitId: uuidSchema.nullable(),
  sourceListingId: uuidSchema.nullable(),
  fullName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  preferredContactMethod: z.string().nullable(),
  preferredLocations: z.array(z.string()),
  maximumBudget: z.number().nullable(),
  currency: z.string().nullable(),
  purchasePurpose: z.string().nullable(),
  financingRequired: z.boolean().nullable(),
  leadTemperature: leadTemperatureSchema,
  salesStage: salesStageSchema,
  handoffReason: handoffReasonSchema.nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema
});

export type LeadResponse = z.infer<typeof leadResponseSchema>;

export const leadCaptureInputSchema = z.object({
  companyId: uuidSchema,
  conversationId: uuidSchema.optional(),
  sourceListingId: uuidSchema.optional(),
  sourcePropertyId: uuidSchema.optional(),
  sourcePropertyUnitId: uuidSchema.optional(),
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  preferredContactMethod: z.string().trim().min(1).optional(),
  preferredLocations: z.array(z.string()).optional(),
  maximumBudget: z.number().nonnegative().optional(),
  currency: z.string().trim().min(1).optional(),
  purchasePurpose: z.string().trim().min(1).optional(),
  financingRequired: z.boolean().optional(),
  leadTemperature: leadTemperatureSchema.optional(),
  salesStage: salesStageSchema.optional(),
  interestSummary: z.string().trim().min(1).optional(),
  handedOffTo: z.string().trim().min(1).optional(),
  handoffReason: handoffReasonSchema.optional()
});

export type LeadCaptureInput = z.input<typeof leadCaptureInputSchema>;

export const visitResponseSchema = z.object({
  id: uuidSchema,
  companyId: uuidSchema,
  conversationId: uuidSchema.nullable(),
  leadId: uuidSchema.nullable(),
  developmentId: uuidSchema.nullable(),
  propertyId: uuidSchema.nullable(),
  propertyUnitId: uuidSchema.nullable(),
  customerName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  preferredDate: z.string().nullable(),
  preferredTimeWindow: z.string().nullable(),
  status: z.string(),
  handoffRequired: z.boolean(),
  assignedAgent: z.string().nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema
});

export type VisitResponse = z.infer<typeof visitResponseSchema>;

export const visitRequestInputSchema = z.object({
  companyId: uuidSchema,
  conversationId: uuidSchema.optional(),
  leadId: uuidSchema.optional(),
  developmentId: uuidSchema.optional(),
  propertyId: uuidSchema.optional(),
  propertyUnitId: uuidSchema.optional(),
  customerName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  preferredDate: z.string().date().optional(),
  preferredTimeWindow: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  assignedAgent: z.string().trim().min(1).optional(),
  idempotencyKey: z.string().trim().min(1).max(120).optional()
});

export type VisitRequestInput = z.input<typeof visitRequestInputSchema>;

export const humanHandoffContactSnapshotSchema = z
  .object({
    fullName: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    preferredContactMethod: z.string().trim().min(1).optional()
  })
  .strict();

export const humanHandoffInputSchema = z.object({
  companyId: uuidSchema,
  conversationId: uuidSchema,
  reason: handoffReasonSchema,
  note: z.string().trim().min(1).optional(),
  propertyId: uuidSchema.optional(),
  unitId: uuidSchema.optional(),
  listingId: uuidSchema.optional(),
  contact: humanHandoffContactSnapshotSchema.optional(),
  idempotencyKey: z.string().trim().min(1).max(120).optional()
});

export type HumanHandoffInput = z.input<typeof humanHandoffInputSchema>;

export const humanHandoffResponseSchema = z.object({
  eventId: uuidSchema,
  companyId: uuidSchema,
  conversationId: uuidSchema,
  salesStage: salesStageSchema,
  handoffRequested: z.boolean(),
  handoffReason: handoffReasonSchema,
  leadId: uuidSchema.nullable(),
  createdLead: z.boolean(),
  note: z.string().nullable(),
  createdAt: isoDatetimeSchema
});

export type HumanHandoffResponse = z.infer<typeof humanHandoffResponseSchema>;
export * from "./public-chat.js";

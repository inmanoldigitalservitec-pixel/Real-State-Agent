import {
  propertyReferenceResolutionSchema,
  resolvePropertyReferenceInputSchema,
  type PropertyReferenceResolution,
  type ResolvePropertyReferenceInput
} from "@real-estate-agent/shared";
import { ServiceException } from "../lib/errors/service-error";
import type { PropertyRepository } from "../repositories/property.repository";

export class PropertyReferenceService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async resolveReference(input: ResolvePropertyReferenceInput): Promise<PropertyReferenceResolution> {
    const parsed = resolvePropertyReferenceInputSchema.parse(input);

    if (parsed.sourcePropertyId) {
      const source = await this.propertyRepository.findById(parsed.sourcePropertyId);

      return propertyReferenceResolutionSchema.parse({
        propertyId: source.property.id,
        propertyName: source.property.name,
        developmentName: source.development.name,
        matchReason: "source_property",
        confidence: 1
      });
    }

    if (parsed.activePropertyId) {
      const active = await this.propertyRepository.findById(parsed.activePropertyId);

      return propertyReferenceResolutionSchema.parse({
        propertyId: active.property.id,
        propertyName: active.property.name,
        developmentName: active.development.name,
        matchReason: "active_property",
        confidence: 0.95
      });
    }

    if (parsed.recentPropertyIds?.length) {
      const recent = await this.propertyRepository.findByIds(parsed.recentPropertyIds);
      const normalized = parsed.reference.toLowerCase();
      const match = recent.find((property) => property.name.toLowerCase().includes(normalized));

      if (match) {
        const recentProperty = await this.propertyRepository.findById(match.id);

        return propertyReferenceResolutionSchema.parse({
          propertyId: recentProperty.property.id,
          propertyName: recentProperty.property.name,
          developmentName: recentProperty.development.name,
          matchReason: "recent_property",
          confidence: 0.8
        });
      }
    }

    if (parsed.sourceListingId) {
      const listing = await this.propertyRepository.findListingById(parsed.sourceListingId);
      const listingProperty = await this.propertyRepository.findById(listing.property_id);

      return propertyReferenceResolutionSchema.parse({
        propertyId: listingProperty.property.id,
        propertyName: listingProperty.property.name,
        developmentName: listingProperty.development.name,
        matchReason: "listing",
        confidence: 0.85
      });
    }

    const candidates = await this.propertyRepository.findReferenceCandidates(parsed.reference, parsed.companyId);
    const exact = candidates[0];

    if (exact) {
      return propertyReferenceResolutionSchema.parse({
        propertyId: exact.property.id,
        propertyName: exact.property.name,
        developmentName: exact.development.name,
        matchReason: "search_match",
        confidence: 0.7
      });
    }

    throw new ServiceException("NOT_FOUND", `Unable to resolve property reference: ${parsed.reference}`);
  }
}

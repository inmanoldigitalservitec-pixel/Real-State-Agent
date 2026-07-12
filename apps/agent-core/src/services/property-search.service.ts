import {
  propertySearchInputSchema,
  propertySearchResultSchema,
  type PropertySearchInput,
  type PropertySearchResult
} from "@real-estate-agent/shared";
import type { MediaRepository } from "../repositories/media.repository";
import type { PropertyRepository } from "../repositories/property.repository";

export class PropertySearchService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly mediaRepository: MediaRepository
  ) {}

  async search(input: PropertySearchInput): Promise<PropertySearchResult[]> {
    const parsed = propertySearchInputSchema.parse(input);
    const rows = await this.propertyRepository.search(parsed);

    const results = await Promise.all(
      rows.map(async ({ property, development, units }) => {
        const cover = await this.mediaRepository.findByScope({
          propertyId: property.id,
          categories: ["cover_image"],
          limit: 1
        });
        const availableUnits = units.filter((unit) => unit.status === "available");
        const lastVerifiedAt = availableUnits
          .map((unit) => unit.last_verified_at)
          .filter((value): value is string => Boolean(value))
          .sort()
          .at(-1) ?? null;

        return propertySearchResultSchema.parse({
          propertyId: property.id,
          propertyCode: property.code,
          propertyName: property.name,
          propertyType: property.property_type,
          developmentId: development.id,
          developmentName: development.name,
          locationLabel: development.location_label,
          sector: development.sector,
          city: development.city,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          parkingSpaces: property.parking_spaces,
          areaFromM2: property.area_from_m2,
          areaToM2: property.area_to_m2,
          priceFrom: property.price_from,
          priceTo: property.price_to,
          currency: property.currency,
          summary: property.summary,
          features: property.features,
          coverImageUrl: cover[0]?.public_url ?? null,
          availableUnits: availableUnits.length,
          lastVerifiedAt
        });
      })
    );

    return results;
  }
}

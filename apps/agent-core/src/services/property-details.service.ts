import { propertyDetailsSchema, type PropertyDetails } from "@real-estate-agent/shared";
import type { PropertyRepository } from "../repositories/property.repository";

export class PropertyDetailsService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async getPropertyDetails(propertyId: string): Promise<PropertyDetails> {
    const { property, development } = await this.propertyRepository.findById(propertyId);
    const units = await this.propertyRepository.findUnitsByPropertyId(propertyId);
    const amenities = await this.propertyRepository.findAmenitiesForScopes({
      propertyId,
      developmentId: development.id
    });

    return propertyDetailsSchema.parse({
      propertyId: property.id,
      propertyName: property.name,
      propertyCode: property.code,
      propertyType: property.property_type,
      developmentId: development.id,
      developmentName: development.name,
      developmentStatus: development.status,
      locationLabel: development.location_label,
      sector: development.sector,
      city: development.city,
      deliveryDateEstimate: development.delivery_date_estimate,
      deliveryNotes: development.delivery_notes,
      summary: property.summary,
      description: property.description,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parking_spaces,
      areaFromM2: property.area_from_m2,
      areaToM2: property.area_to_m2,
      priceFrom: property.price_from,
      priceTo: property.price_to,
      currency: property.currency,
      features: property.features,
      availableUnits: units.filter((unit) => unit.status === "available").length,
      totalUnits: units.length,
      amenities: amenities.map((amenity) => ({
        id: amenity.id,
        name: amenity.name,
        category: amenity.category,
        description: amenity.description,
        isHighlight: amenity.is_highlight,
        scope: amenity.property_unit_id
          ? "unit"
          : amenity.property_id
            ? "property"
            : "development"
      }))
    });
  }
}

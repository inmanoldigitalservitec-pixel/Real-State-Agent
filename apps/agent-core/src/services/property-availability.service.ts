import { propertyAvailabilityResultSchema, type PropertyAvailabilityResult } from "@real-estate-agent/shared";
import type { PropertyRepository } from "../repositories/property.repository";

export class PropertyAvailabilityService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async checkPropertyAvailability(propertyId: string): Promise<PropertyAvailabilityResult> {
    const units = await this.propertyRepository.findUnitsByPropertyId(propertyId);
    const availableUnits = units.filter((unit) => unit.status === "available");
    const lastVerifiedAt = units
      .map((unit) => unit.last_verified_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

    return propertyAvailabilityResultSchema.parse({
      propertyId,
      available: availableUnits.length > 0,
      availableUnits: availableUnits.length,
      lastVerifiedAt,
      units: availableUnits.map((unit) => ({
        unitId: unit.id,
        unitNumber: unit.unit_number,
        unitCode: unit.unit_code,
        listPrice: unit.list_price,
        currency: unit.currency,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        parkingSpaces: unit.parking_spaces,
        totalAreaM2: unit.total_area_m2,
        status: unit.status
      }))
    });
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeLocation, resolveLocationGroup } from "../domain/geography/location-groups";
import type { Database, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabase, unwrapSupabaseList } from "../lib/supabase-utils";

export type PropertyRecord = TableRow<"properties">;
export type PropertyUnitRecord = TableRow<"property_units">;
export type DevelopmentRecord = TableRow<"developments">;
export type PropertyAmenityRecord = TableRow<"property_amenities">;
export type PropertyListingRecord = TableRow<"property_listings">;

export class PropertyRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async search(filters: {
    companyId?: string;
    location?: string;
    sector?: string;
    city?: string;
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    minimumPrice?: number;
    maximumPrice?: number;
    currency?: string;
    propertyType?: string;
      availability?: string;
      amenities?: string[];
      limit: number;
  }): Promise<Array<{ property: PropertyRecord; development: DevelopmentRecord; units: PropertyUnitRecord[] }>> {
    let query = this.supabase
      .from("properties")
      .select(
        `
        *,
        development:developments(*),
        units:property_units(*)
      `
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(Math.max(filters.limit * 5, 25));

    if (filters.companyId) {
      query = query.eq("company_id", filters.companyId);
    }

    if (filters.bedrooms !== undefined) {
      query = query.eq("bedrooms", filters.bedrooms);
    }

    if (filters.currency) {
      query = query.eq("currency", filters.currency);
    }

    if (filters.propertyType) {
      query = query.eq("property_type", filters.propertyType);
    }

    const rows = unwrapSupabaseList(
      await query,
      "Unable to search properties"
    ) as Array<PropertyRecord & { development: DevelopmentRecord; units: PropertyUnitRecord[] }>;

    const normalizedLocation = filters.location ? normalizeLocation(filters.location) : undefined;
    const locationGroup = filters.location ? resolveLocationGroup(filters.location) : null;
    const normalizedSector = filters.sector?.toLowerCase();
    const normalizedCity = filters.city?.toLowerCase();
    const normalizedAmenities = filters.amenities?.map((item) => item.toLowerCase()) ?? [];
    const amenitiesByScope: Array<Pick<PropertyAmenityRecord, "property_id" | "development_id" | "name">> =
      normalizedAmenities.length > 0
        ? unwrapSupabaseList(
            await this.supabase.from("property_amenities").select("property_id, development_id, name"),
            "Unable to load amenities for property search"
          ) as Array<Pick<PropertyAmenityRecord, "property_id" | "development_id" | "name">>
        : [];

    return rows
      .filter((row) => {
        if (normalizedCity && row.development.city.toLowerCase() !== normalizedCity) {
          return false;
        }

        if (
          normalizedSector &&
          !(row.development.sector ?? "").toLowerCase().includes(normalizedSector)
        ) {
          return false;
        }

        if (normalizedLocation) {
          const haystack = [
            row.name,
            row.development.location_label,
            row.development.sector,
            row.development.city,
            row.development.province
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const locationAliases = locationGroup ?? [normalizedLocation];

          if (!locationAliases.some((alias) => haystack.includes(alias))) {
            return false;
          }
        }

        if (filters.bathrooms !== undefined && (row.bathrooms ?? 0) < filters.bathrooms) {
          return false;
        }

        if (filters.parkingSpaces !== undefined && (row.parking_spaces ?? 0) < filters.parkingSpaces) {
          return false;
        }

        if (filters.minimumPrice !== undefined && row.price_to !== null && row.price_to < filters.minimumPrice) {
          return false;
        }

        if (filters.maximumPrice !== undefined && row.price_from !== null && row.price_from > filters.maximumPrice) {
          return false;
        }

        if (filters.availability && !row.units.some((unit) => unit.is_active && unit.status === filters.availability)) {
          return false;
        }

        if (normalizedAmenities.length > 0) {
          const searchableAmenities = new Set(
            [
              ...row.features,
              ...amenitiesByScope
                .filter(
                  (amenity) =>
                    amenity.property_id === row.id ||
                    amenity.development_id === row.development.id
                )
                .map((amenity) => amenity.name)
            ]
              .filter(Boolean)
              .map((value) => value.toLowerCase())
          );

          if (!normalizedAmenities.every((amenity) => searchableAmenities.has(amenity))) {
            return false;
          }
        }

        return true;
      })
      .slice(0, filters.limit)
      .map((row) => ({
        property: row,
        development: row.development,
        units: row.units.filter((unit) => unit.is_active)
      }));
  }

  async findById(propertyId: string): Promise<{ property: PropertyRecord; development: DevelopmentRecord }> {
    const row = unwrapSupabase(
      await this.supabase
        .from("properties")
        .select("*, development:developments(*)")
        .eq("id", propertyId)
        .single(),
      `Property ${propertyId} not found`
    ) as PropertyRecord & { development: DevelopmentRecord };

    return {
      property: row,
      development: row.development
    };
  }

  async findByIds(propertyIds: string[]): Promise<PropertyRecord[]> {
    if (propertyIds.length === 0) {
      return [];
    }

    return unwrapSupabaseList(
      await this.supabase.from("properties").select("*").in("id", propertyIds),
      "Unable to load properties by ids"
    );
  }

  async findUnitsByPropertyId(propertyId: string): Promise<PropertyUnitRecord[]> {
    return unwrapSupabaseList(
      await this.supabase
        .from("property_units")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_active", true)
        .order("unit_number", { ascending: true }),
      `Unable to list units for property ${propertyId}`
    );
  }

  async findUnitById(unitId: string): Promise<PropertyUnitRecord> {
    return unwrapSupabase(
      await this.supabase.from("property_units").select("*").eq("id", unitId).single(),
      `Unit ${unitId} not found`
    );
  }

  async findAmenitiesForScopes(params: {
    propertyId: string;
    developmentId: string;
    unitId?: string | null;
  }): Promise<PropertyAmenityRecord[]> {
    const rows = unwrapSupabaseList(
      await this.supabase
        .from("property_amenities")
        .select("*")
        .order("sort_order", { ascending: true }),
      `Unable to list amenities for property ${params.propertyId}`
    ) as PropertyAmenityRecord[];

    return rows.filter(
      (row) =>
        row.property_id === params.propertyId ||
        row.development_id === params.developmentId ||
        (!!params.unitId && row.property_unit_id === params.unitId)
    );
  }

  async findListingById(listingId: string): Promise<PropertyListingRecord> {
    return unwrapSupabase(
      await this.supabase.from("property_listings").select("*").eq("id", listingId).single(),
      `Listing ${listingId} not found`
    );
  }

  async findListingCandidates(reference: string, companyId?: string): Promise<PropertyListingRecord[]> {
    let query = this.supabase
      .from("property_listings")
      .select("*")
      .eq("is_active", true)
      .eq("status", "published")
      .limit(20);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const rows = unwrapSupabaseList(
      await query,
      "Unable to resolve listing candidates"
    ) as PropertyListingRecord[];
    const normalizedReference = reference.toLowerCase();

    return rows.filter((row) => {
      const haystack = [row.title, row.description, row.slug, ...(row.search_tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedReference);
    });
  }

  async findReferenceCandidates(reference: string, companyId?: string): Promise<Array<{ property: PropertyRecord; development: DevelopmentRecord }>> {
    const rows = await this.search({
      companyId,
      location: reference,
      limit: 5
    });

    return rows.map((row) => ({
      property: row.property,
      development: row.development
    }));
  }
}

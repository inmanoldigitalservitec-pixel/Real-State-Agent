import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabaseList } from "../lib/supabase-utils";

export type PropertyDocumentRecord = TableRow<"property_documents">;

export class DocumentRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByScope(params: {
    propertyId?: string;
    developmentId?: string;
    unitId?: string;
    categories?: string[];
  }): Promise<PropertyDocumentRecord[]> {
    let query = this.supabase
      .from("property_documents")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const scopeFilters = [
      params.unitId ? `property_unit_id.eq.${params.unitId}` : null,
      params.propertyId ? `property_id.eq.${params.propertyId}` : null,
      params.developmentId ? `development_id.eq.${params.developmentId}` : null
    ].filter((value): value is string => Boolean(value));

    if (scopeFilters.length === 1) {
      const [field, value] = scopeFilters[0].split(".eq.");
      query = query.eq(field as "property_unit_id" | "property_id" | "development_id", value);
    } else if (scopeFilters.length > 1) {
      query = query.or(scopeFilters.join(","));
    }

    if (params.categories?.length) {
      query = query.in("category", params.categories);
    }

    return unwrapSupabaseList(await query, "Unable to load property documents");
  }
}

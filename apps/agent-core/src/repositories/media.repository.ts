import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabaseList } from "../lib/supabase-utils";

export type PropertyMediaRecord = TableRow<"property_media">;

export class MediaRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByScope(params: {
    propertyId?: string;
    developmentId?: string;
    unitId?: string;
    categories?: string[];
    limit?: number;
  }): Promise<PropertyMediaRecord[]> {
    let query = this.supabase
      .from("property_media")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(params.limit ?? 20);

    if (params.propertyId) {
      query = query.eq("property_id", params.propertyId);
    } else if (params.unitId) {
      query = query.eq("property_unit_id", params.unitId);
    } else if (params.developmentId) {
      query = query.eq("development_id", params.developmentId);
    }

    if (params.categories?.length) {
      query = query.in("category", params.categories);
    }

    return unwrapSupabaseList(await query, "Unable to load property media");
  }
}

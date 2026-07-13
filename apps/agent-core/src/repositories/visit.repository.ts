import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableInsert, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabase } from "../lib/supabase-utils";

export type VisitRequestRecord = TableRow<"visit_requests">;

export class VisitRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByIdempotencyKey(companyId: string, idempotencyKey: string): Promise<VisitRequestRecord | null> {
    const result = await this.supabase
      .from("visit_requests")
      .select("*")
      .eq("company_id", companyId)
      .contains("metadata", { idempotencyKey })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async insert(payload: TableInsert<"visit_requests">): Promise<VisitRequestRecord> {
    return unwrapSupabase(
      await this.supabase.from("visit_requests").insert(payload as never).select("*").single(),
      "Unable to create visit request"
    );
  }
}

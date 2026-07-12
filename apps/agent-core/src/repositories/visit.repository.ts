import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableInsert, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabase } from "../lib/supabase-utils";

export type VisitRequestRecord = TableRow<"visit_requests">;

export class VisitRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async insert(payload: TableInsert<"visit_requests">): Promise<VisitRequestRecord> {
    return unwrapSupabase(
      await this.supabase.from("visit_requests").insert(payload as never).select("*").single(),
      "Unable to create visit request"
    );
  }
}

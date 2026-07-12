import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableInsert, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabase } from "../lib/supabase-utils";

export type AgentEventRecord = TableRow<"agent_events">;

export class EventRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async insert(payload: TableInsert<"agent_events">): Promise<AgentEventRecord> {
    return unwrapSupabase(
      await this.supabase.from("agent_events").insert(payload as never).select("*").single(),
      "Unable to create agent event"
    );
  }
}

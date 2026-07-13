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

  async findHandoffByIdempotencyKey(conversationId: string, idempotencyKey: string): Promise<AgentEventRecord | null> {
    const result = await this.supabase
      .from("agent_events")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("event_type", "handoff_requested")
      .contains("event_payload", { idempotencyKey })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async listByConversationAndType(conversationId: string, eventType: AgentEventRecord["event_type"]): Promise<AgentEventRecord[]> {
    const result = await this.supabase
      .from("agent_events")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("event_type", eventType)
      .order("created_at", { ascending: false })
      .limit(10);

    if (result.error) {
      throw result.error;
    }

    return result.data ?? [];
  }
}

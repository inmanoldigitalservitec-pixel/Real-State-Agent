import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableInsert, TableRow, TableUpdate } from "../infrastructure/supabase/types";
import { unwrapSupabase, unwrapSupabaseList } from "../lib/supabase-utils";

export type LeadRecord = TableRow<"leads">;

export class LeadRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findExistingLead(params: {
    conversationId?: string;
    phone?: string;
    sourcePropertyId?: string;
  }): Promise<LeadRecord | null> {
    let query = this.supabase.from("leads").select("*").limit(1);

    if (params.conversationId) {
      query = query.eq("conversation_id", params.conversationId);
    } else if (params.phone && params.sourcePropertyId) {
      query = query.eq("phone", params.phone).eq("source_property_id", params.sourcePropertyId);
    } else if (params.phone) {
      query = query.eq("phone", params.phone);
    }

    const result = await query.maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async insert(payload: TableInsert<"leads">): Promise<LeadRecord> {
    return unwrapSupabase(
      await this.supabase.from("leads").insert(payload as never).select("*").single(),
      "Unable to create lead"
    );
  }

  async update(leadId: string, patch: TableUpdate<"leads">): Promise<LeadRecord> {
    return unwrapSupabase(
      await this.supabase.from("leads").update(patch as never).eq("id", leadId).select("*").single(),
      `Unable to update lead ${leadId}`
    );
  }

  async listByConversation(conversationId: string): Promise<LeadRecord[]> {
    return unwrapSupabaseList(
      await this.supabase.from("leads").select("*").eq("conversation_id", conversationId),
      `Unable to list leads for conversation ${conversationId}`
    );
  }
}

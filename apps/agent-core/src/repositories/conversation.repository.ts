import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableInsert, TableRow, TableUpdate } from "../infrastructure/supabase/types";
import { unwrapSupabase, unwrapSupabaseList } from "../lib/supabase-utils";

export type ConversationRecord = TableRow<"conversations">;
export type MessageRecord = TableRow<"messages">;
export type ConversationStateRecord = TableRow<"conversation_state">;

export class ConversationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findConversationById(conversationId: string): Promise<ConversationRecord> {
    return unwrapSupabase(
      await this.supabase.from("conversations").select("*").eq("id", conversationId).single(),
      `Conversation ${conversationId} not found`
    );
  }

  async findState(conversationId: string): Promise<ConversationStateRecord | null> {
    const result = await this.supabase
      .from("conversation_state")
      .select("*")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async findMessages(conversationId: string, limit = 20): Promise<MessageRecord[]> {
    return unwrapSupabaseList(
      await this.supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit),
      `Unable to load messages for conversation ${conversationId}`
    );
  }

  async upsertState(payload: TableInsert<"conversation_state">): Promise<ConversationStateRecord> {
    return unwrapSupabase(
      await this.supabase
        .from("conversation_state")
        .upsert(payload as never, { onConflict: "conversation_id" })
        .select("*")
        .single(),
      `Unable to upsert state for conversation ${payload.conversation_id}`
    );
  }

  async updateState(conversationId: string, patch: TableUpdate<"conversation_state">): Promise<ConversationStateRecord> {
    return unwrapSupabase(
      await this.supabase
        .from("conversation_state")
        .update(patch as never)
        .eq("conversation_id", conversationId)
        .select("*")
        .single(),
      `Unable to update state for conversation ${conversationId}`
    );
  }

  async insertMessage(payload: TableInsert<"messages">): Promise<MessageRecord> {
    return unwrapSupabase(
      await this.supabase.from("messages").insert(payload as never).select("*").single(),
      `Unable to save message for conversation ${payload.conversation_id}`
    );
  }

  async updateConversation(
    conversationId: string,
    patch: TableUpdate<"conversations">
  ): Promise<ConversationRecord> {
    return unwrapSupabase(
      await this.supabase
        .from("conversations")
        .update(patch as never)
        .eq("id", conversationId)
        .select("*")
        .single(),
      `Unable to update conversation ${conversationId}`
    );
  }
}

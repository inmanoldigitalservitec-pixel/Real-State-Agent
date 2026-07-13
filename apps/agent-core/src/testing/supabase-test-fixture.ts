import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBackendSupabaseClient } from "../infrastructure/supabase/client";
import type { Database, Json, TableRow } from "../infrastructure/supabase/types";
import { createTaggedId } from "./run-id";

const COMPANY_ID = "00000000-0000-0000-0000-000000000001";
const DEVELOPMENT_ID = "00000000-0000-0000-0000-000000000101";
const PROPERTY_ID = "00000000-0000-0000-0000-000000000201";
const UNIT_ID = "00000000-0000-0000-0000-000000000301";
const LISTING_ID = "00000000-0000-0000-0000-000000000701";
const SEED_CONVERSATION_ID = "00000000-0000-0000-0000-000000001001";
const SEED_LEAD_ID = "00000000-0000-0000-0000-000000001301";

type RunRecordSummary = {
  conversations: string[];
  conversationStates: string[];
  messages: string[];
  leads: string[];
  visitRequests: string[];
  agentEvents: string[];
};

export type RunRecordCounts = {
  conversations: number;
  conversationStates: number;
  messages: number;
  leads: number;
  visitRequests: number;
  agentEvents: number;
};

export type CleanupResult = {
  deletedAgentEvents: number;
  deletedVisitRequests: number;
  deletedLeads: number;
  deletedConversations: number;
};

export type SeedSnapshot = {
  conversation: {
    id: string;
    currentSalesStage: string;
    status: string;
    summary: string | null;
    sourceListingId: string | null;
    sourcePropertyId: string | null;
    lastMessageAt: string;
    updatedAt: string;
  };
  memory: {
    memoryVersion: number;
    salesStage: string;
    handoffRequested: boolean;
    handoffReason: string | null;
    pendingQuestion: string | null;
    conversationSummary: string | null;
    updatedAt: string;
  };
  seedMessageCount: number;
  lead: {
    id: string;
    conversationId: string | null;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    salesStage: string;
    status: string;
    handoffReason: string | null;
    interestSummary: string | null;
    metadata: Json;
    updatedAt: string;
  };
};

export type SupabaseTestFixture = {
  runId: string;
  conversationId: string;
  conversationStateId: string;
  companyId: string;
  developmentId: string;
  propertyId: string;
  propertyUnitId: string;
  listingId: string;
  externalSessionId: string;
  customerName: string;
  phone: string;
  email: string;
  leadId: string | null;
  cleanup: () => Promise<CleanupResult>;
};

function getSupabase(supabase?: SupabaseClient<Database>) {
  return supabase ?? getBackendSupabaseClient();
}

function getRunTimestamp() {
  return new Date().toISOString().replace(/[^\d]/g, "").slice(0, 14);
}

function getRunSuffix() {
  return randomUUID().replace(/-/g, "").slice(0, 10);
}

function unwrapList<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) {
    throw result.error;
  }

  return (result.data as T[] | null) ?? [];
}

function countSummary(summary: RunRecordSummary): RunRecordCounts {
  return {
    conversations: summary.conversations.length,
    conversationStates: summary.conversationStates.length,
    messages: summary.messages.length,
    leads: summary.leads.length,
    visitRequests: summary.visitRequests.length,
    agentEvents: summary.agentEvents.length
  };
}

export function createSupabaseTestRunId() {
  return `itest_${getRunTimestamp()}_${getRunSuffix()}`;
}

export async function createSupabaseTestFixture(options?: {
  supabase?: SupabaseClient<Database>;
  createLead?: boolean;
  runId?: string;
}) {
  const supabase = getSupabase(options?.supabase);
  const runId = options?.runId ?? createSupabaseTestRunId();
  const conversationId = randomUUID();
  const conversationStateId = randomUUID();
  const leadId = options?.createLead ? randomUUID() : null;
  const externalSessionId = `${runId}_session_${getRunSuffix()}`;
  const customerName = `Fixture ${runId}`;
  const numericRunId = runId.replace(/\D/g, "").padStart(10, "0");
  const phone = `+1-809-${numericRunId.slice(-7, -4)}-${numericRunId.slice(-4)}`;
  const email = `${runId}@example.test`;
  const metadata = {
    runId,
    createdBy: "supabase-test-fixture",
    isTemporary: true
  } satisfies Record<string, Json>;

  try {
    const conversationInsert = await supabase
      .from("conversations")
      .insert({
        id: conversationId,
        company_id: COMPANY_ID,
        channel: "web",
        external_session_id: externalSessionId,
        source_listing_id: LISTING_ID,
        source_property_id: PROPERTY_ID,
        source_property_unit_id: UNIT_ID,
        current_sales_stage: "INQUIRY",
        status: "active",
        customer_display_name: customerName,
        preferred_contact_method: "whatsapp",
        summary: `Temporary fixture for ${runId}`,
        metadata
      } as never)
      .select("id")
      .single();

    if (conversationInsert.error) {
      throw conversationInsert.error;
    }

    const stateInsert = await supabase
      .from("conversation_state")
      .insert({
        id: conversationStateId,
        conversation_id: conversationId,
        company_id: COMPANY_ID,
        customer_name: customerName,
        phone,
        email,
        preferred_contact_method: "whatsapp",
        preferred_locations: ["Villa Mella"],
        bedrooms: 3,
        maximum_budget: 7000000,
        currency: "DOP",
        purchase_purpose: "live",
        financing_required: true,
        purchase_timeline: "within_3_months",
        main_objections: ["initial_payment"],
        lead_temperature: "warm",
        sales_stage: "INQUIRY",
        active_property_id: PROPERTY_ID,
        active_property_unit_id: UNIT_ID,
        interested_property_ids: [PROPERTY_ID],
        recommended_property_ids: [PROPERTY_ID],
        viewed_property_ids: [],
        rejected_property_ids: [],
        recent_property_ids: [PROPERTY_ID],
        sent_asset_ids: [],
        sent_brochure_ids: [],
        sent_floor_plan_ids: [],
        sent_payment_plan_ids: [],
        last_customer_intent: "initial_inquiry",
        pending_question: "Confirmar proxima accion",
        conversation_summary: `Temporary state for ${runId}`,
        source_channel: "web",
        source_listing_id: LISTING_ID,
        source_property_id: PROPERTY_ID,
        visit_requested: false,
        handoff_requested: false,
        assigned_agent: "Asesor Test",
        metadata
      } as never)
      .select("id")
      .single();

    if (stateInsert.error) {
      throw stateInsert.error;
    }

    if (leadId) {
      const leadInsert = await supabase
        .from("leads")
        .insert({
          id: leadId,
          company_id: COMPANY_ID,
          conversation_id: conversationId,
          source_listing_id: LISTING_ID,
          source_property_id: PROPERTY_ID,
          source_property_unit_id: UNIT_ID,
          full_name: customerName,
          phone,
          email,
          preferred_contact_method: "whatsapp",
          preferred_locations: ["Villa Mella"],
          maximum_budget: 7000000,
          currency: "DOP",
          purchase_purpose: "live",
          financing_required: true,
          lead_temperature: "warm",
          sales_stage: "INQUIRY",
          status: "new",
          interest_summary: `Temporary lead for ${runId}`,
          metadata
        } as never)
        .select("id")
        .single();

      if (leadInsert.error) {
        throw leadInsert.error;
      }
    }

    return {
      runId,
      conversationId,
      conversationStateId,
      companyId: COMPANY_ID,
      developmentId: DEVELOPMENT_ID,
      propertyId: PROPERTY_ID,
      propertyUnitId: UNIT_ID,
      listingId: LISTING_ID,
      externalSessionId,
      customerName,
      phone,
      email,
      leadId,
      cleanup: () => cleanupRunData(runId, { supabase, conversationId })
    } satisfies SupabaseTestFixture;
  } catch (error) {
    await cleanupRunData(runId, { supabase, conversationId });
    throw error;
  }
}

export async function listRunRecords(runId: string, supabase?: SupabaseClient<Database>): Promise<RunRecordSummary> {
  const client = getSupabase(supabase);
  const messagePrefix = `${runId}:%`;
  const [
    conversations,
    states,
    messages,
    leads,
    visitRequests,
    agentEvents
  ] = await Promise.all([
    client.from("conversations").select("id").contains("metadata", { runId }),
    client.from("conversation_state").select("id").contains("metadata", { runId }),
    client.from("messages").select("id, client_message_id").like("client_message_id", messagePrefix),
    client.from("leads").select("id").contains("metadata", { runId }),
    client.from("visit_requests").select("id").contains("metadata", { runId }),
    client.from("agent_events").select("id").contains("event_payload", { runId })
  ]);

  return {
    conversations: unwrapList<{ id: string }>(conversations as { data: { id: string }[] | null; error: { message: string } | null }).map((row) => row.id),
    conversationStates: unwrapList<{ id: string }>(states as { data: { id: string }[] | null; error: { message: string } | null }).map((row) => row.id),
    messages: unwrapList<{ id: string }>(messages as { data: { id: string }[] | null; error: { message: string } | null }).map((row) => row.id),
    leads: unwrapList<{ id: string }>(leads as { data: { id: string }[] | null; error: { message: string } | null }).map((row) => row.id),
    visitRequests: unwrapList<{ id: string }>(visitRequests as { data: { id: string }[] | null; error: { message: string } | null }).map((row) => row.id),
    agentEvents: unwrapList<{ id: string }>(agentEvents as { data: { id: string }[] | null; error: { message: string } | null }).map((row) => row.id)
  };
}

export async function getRunRecordCounts(runId: string, supabase?: SupabaseClient<Database>) {
  return countSummary(await listRunRecords(runId, supabase));
}

export async function cleanupRunData(
  runId: string,
  options?: { supabase?: SupabaseClient<Database>; conversationId?: string }
): Promise<CleanupResult> {
  const client = getSupabase(options?.supabase);

  const agentEventsDelete = await client
    .from("agent_events")
    .delete()
    .contains("event_payload", { runId })
    .select("id");
  if (agentEventsDelete.error) {
    throw agentEventsDelete.error;
  }

  const visitDelete = await client
    .from("visit_requests")
    .delete()
    .contains("metadata", { runId })
    .select("id");
  if (visitDelete.error) {
    throw visitDelete.error;
  }

  const leadDelete = await client
    .from("leads")
    .delete()
    .contains("metadata", { runId })
    .select("id");
  if (leadDelete.error) {
    throw leadDelete.error;
  }

  let conversationDelete;
  if (options?.conversationId) {
    conversationDelete = await client
      .from("conversations")
      .delete()
      .eq("id", options.conversationId)
      .contains("metadata", { runId })
      .select("id");
  } else {
    conversationDelete = await client
      .from("conversations")
      .delete()
      .contains("metadata", { runId })
      .select("id");
  }

  if (conversationDelete.error) {
    throw conversationDelete.error;
  }

  return {
    deletedAgentEvents: (agentEventsDelete.data ?? []).length,
    deletedVisitRequests: (visitDelete.data ?? []).length,
    deletedLeads: (leadDelete.data ?? []).length,
    deletedConversations: (conversationDelete.data ?? []).length
  };
}

export async function assertRunCleanup(runId: string, supabase?: SupabaseClient<Database>) {
  const counts = await getRunRecordCounts(runId, supabase);

  if (Object.values(counts).some((count) => count !== 0)) {
    throw new Error(`Run ${runId} cleanup incomplete: ${JSON.stringify(counts)}`);
  }

  return counts;
}

export async function captureSeedSnapshot(supabase?: SupabaseClient<Database>): Promise<SeedSnapshot> {
  const client = getSupabase(supabase);
  const [conversation, memory, lead, seedMessages] = await Promise.all([
    client
      .from("conversations")
      .select("id, current_sales_stage, status, summary, source_listing_id, source_property_id, last_message_at, updated_at")
      .eq("id", SEED_CONVERSATION_ID)
      .single(),
    client
      .from("conversation_state")
      .select("memory_version, sales_stage, handoff_requested, handoff_reason, pending_question, conversation_summary, updated_at")
      .eq("conversation_id", SEED_CONVERSATION_ID)
      .single(),
    client
      .from("leads")
      .select("id, conversation_id, full_name, phone, email, sales_stage, status, handoff_reason, interest_summary, metadata, updated_at")
      .eq("id", SEED_LEAD_ID)
      .single(),
    client
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", SEED_CONVERSATION_ID)
  ]);

  if (conversation.error) {
    throw conversation.error;
  }
  if (memory.error) {
    throw memory.error;
  }
  if (lead.error) {
    throw lead.error;
  }
  if (seedMessages.error) {
    throw seedMessages.error;
  }

  const conversationData = conversation.data as Pick<
    TableRow<"conversations">,
    "id" | "current_sales_stage" | "status" | "summary" | "source_listing_id" | "source_property_id" | "last_message_at" | "updated_at"
  >;
  const memoryData = memory.data as Pick<
    TableRow<"conversation_state">,
    "memory_version" | "sales_stage" | "handoff_requested" | "handoff_reason" | "pending_question" | "conversation_summary" | "updated_at"
  >;
  const leadData = lead.data as Pick<
    TableRow<"leads">,
    "id" | "conversation_id" | "full_name" | "phone" | "email" | "sales_stage" | "status" | "handoff_reason" | "interest_summary" | "metadata" | "updated_at"
  >;

  return {
    conversation: {
      id: conversationData.id,
      currentSalesStage: conversationData.current_sales_stage,
      status: conversationData.status,
      summary: conversationData.summary,
      sourceListingId: conversationData.source_listing_id,
      sourcePropertyId: conversationData.source_property_id,
      lastMessageAt: conversationData.last_message_at,
      updatedAt: conversationData.updated_at
    },
    memory: {
      memoryVersion: memoryData.memory_version,
      salesStage: memoryData.sales_stage,
      handoffRequested: memoryData.handoff_requested,
      handoffReason: memoryData.handoff_reason,
      pendingQuestion: memoryData.pending_question,
      conversationSummary: memoryData.conversation_summary,
      updatedAt: memoryData.updated_at
    },
    seedMessageCount: seedMessages.count ?? 0,
    lead: {
      id: leadData.id,
      conversationId: leadData.conversation_id,
      fullName: leadData.full_name,
      phone: leadData.phone,
      email: leadData.email,
      salesStage: leadData.sales_stage,
      status: leadData.status,
      handoffReason: leadData.handoff_reason,
      interestSummary: leadData.interest_summary,
      metadata: leadData.metadata,
      updatedAt: leadData.updated_at
    }
  };
}

export function assertSeedSnapshotsEqual(before: SeedSnapshot, after: SeedSnapshot) {
  const serializedBefore = JSON.stringify(before);
  const serializedAfter = JSON.stringify(after);

  if (serializedBefore !== serializedAfter) {
    throw new Error(
      `Seed data changed unexpectedly.\nBefore: ${serializedBefore}\nAfter: ${serializedAfter}`
    );
  }
}

export function createRunScopedMessageId(runId: string, suffix: string) {
  return createTaggedId(runId, suffix);
}

export const supabaseTestSeeds = {
  companyId: COMPANY_ID,
  developmentId: DEVELOPMENT_ID,
  propertyId: PROPERTY_ID,
  propertyUnitId: UNIT_ID,
  listingId: LISTING_ID,
  seedConversationId: SEED_CONVERSATION_ID,
  seedLeadId: SEED_LEAD_ID
} as const;

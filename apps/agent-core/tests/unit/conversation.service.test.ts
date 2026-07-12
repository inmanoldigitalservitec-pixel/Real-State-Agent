import { describe, expect, it } from "vitest";
import { ConversationService } from "../../src/services/conversation.service";

describe("ConversationService", () => {
  it("merges arrays and preserves prior memory when updating state", async () => {
    let state = {
      id: "aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa",
      conversation_id: "88888888-8888-1888-8888-888888888888",
      company_id: "99999999-9999-1999-8999-999999999999",
      customer_name: null,
      phone: null,
      email: null,
      preferred_contact_method: null,
      preferred_locations: ["Villa Mella"],
      rejected_locations: [],
      bedrooms: 3,
      bathrooms: null,
      parking_spaces: null,
      property_types: [],
      minimum_area_m2: null,
      maximum_budget: 7000000,
      currency: "DOP",
      important_amenities: [],
      delivery_preference: null,
      purchase_purpose: null,
      financing_required: null,
      purchase_timeline: null,
      main_objections: [],
      lead_temperature: "warm",
      sales_stage: "DISCOVERY",
      active_property_id: null,
      active_property_unit_id: null,
      interested_property_ids: [],
      recommended_property_ids: [],
      viewed_property_ids: [],
      rejected_property_ids: [],
      recent_property_ids: [],
      sent_asset_ids: [],
      sent_brochure_ids: [],
      sent_floor_plan_ids: [],
      sent_payment_plan_ids: [],
      last_customer_intent: null,
      last_agent_question: null,
      pending_question: null,
      conversation_summary: null,
      source_channel: "web",
      source_listing_id: null,
      source_property_id: null,
      visit_requested: false,
      preferred_visit_date: null,
      preferred_visit_time: null,
      handoff_requested: false,
      handoff_reason: null,
      assigned_agent: null,
      memory_version: 1,
      metadata: {},
      created_at: "2026-07-12T00:00:00.000Z",
      updated_at: "2026-07-12T00:00:00.000Z"
    };

    const repository = {
      async findConversationById() {
        return {
          id: "88888888-8888-1888-8888-888888888888",
          company_id: "99999999-9999-1999-8999-999999999999",
          channel: "web",
          external_session_id: null,
          source_listing_id: null,
          source_property_id: null,
          source_property_unit_id: null,
          current_sales_stage: "DISCOVERY",
          status: "active",
          customer_display_name: null,
          preferred_contact_method: null,
          started_at: "2026-07-12T00:00:00.000Z",
          last_message_at: "2026-07-12T00:00:00.000Z",
          closed_at: null,
          summary: null,
          assigned_agent: null,
          metadata: {},
          created_at: "2026-07-12T00:00:00.000Z",
          updated_at: "2026-07-12T00:00:00.000Z"
        };
      },
      async findState() {
        return state;
      },
      async findMessages() {
        return [];
      },
      async updateState(_: string, patch: Record<string, unknown>) {
        state = {
          ...state,
          ...patch,
          preferred_locations: patch.preferred_locations as string[],
          main_objections: patch.main_objections as string[],
          viewed_property_ids: patch.viewed_property_ids as string[],
          memory_version: patch.memory_version as number
        };

        return state;
      },
      async updateConversation() {
        return await this.findConversationById();
      },
      async insertMessage() {
        throw new Error("not implemented");
      }
    };

    const service = new ConversationService(repository as never);
    const memory = await service.updateConversationState("88888888-8888-1888-8888-888888888888", {
      preferredLocations: ["Kennedy"],
      mainObjections: ["price"],
      viewedPropertyIds: ["44444444-4444-4444-8444-444444444444"]
    });

    expect(memory.preferredLocations).toEqual(["Villa Mella", "Kennedy"]);
    expect(memory.mainObjections).toEqual(["price"]);
    expect(memory.viewedPropertyIds).toEqual(["44444444-4444-4444-8444-444444444444"]);
    expect(memory.memoryVersion).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { ConversationService } from "../../src/services/conversation.service";
import { ServiceException } from "../../src/lib/errors/service-error";

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

  it("deduplicates messages by clientMessageId", async () => {
    let inserted = false;
    const existingMessage = {
      id: "11111111-1111-1111-1111-111111111111",
      conversation_id: "88888888-8888-1888-8888-888888888888",
      company_id: "99999999-9999-1999-8999-999999999999",
      role: "user",
      content: "Hola",
      sales_stage: "INQUIRY",
      client_message_id: "client-123",
      tool_name: null,
      raw_payload: null,
      ui_payload: null,
      asset_ids: [],
      created_at: "2026-07-12T00:00:00.000Z",
      updated_at: "2026-07-12T00:00:00.000Z"
    };

    const repository = {
      async findConversationById() {
        return {
          id: "88888888-8888-1888-8888-888888888888",
          company_id: "99999999-9999-1999-8999-999999999999"
        };
      },
      async findMessageByClientMessageId() {
        return existingMessage;
      },
      async insertMessage() {
        inserted = true;
        throw new Error("insert should not be called");
      },
      async updateConversation() {
        throw new Error("update should not be called");
      }
    };

    const service = new ConversationService(repository as never);
    const message = await service.saveMessage({
      conversationId: "88888888-8888-1888-8888-888888888888",
      companyId: "99999999-9999-1999-8999-999999999999",
      role: "user",
      content: "Hola",
      clientMessageId: "client-123"
    });

    expect(inserted).toBe(false);
    expect(message.id).toBe(existingMessage.id);
    expect(message.content).toBe("Hola");
  });

  it("resolves an existing conversation by external session and preserves state", async () => {
    const repository = createResolveRepository({
      conversation: createConversationRecord({ channel: "web", external_session_id: "session-1" }),
      state: createStateRecord()
    });
    const service = new ConversationService(repository as never, createCompanyRepository() as never);

    const result = await service.resolveOrCreateConversation({
      companyId: "99999999-9999-1999-8999-999999999999",
      channel: "web",
      externalSessionId: "session-1"
    });

    expect(result.created).toBe(false);
    expect(result.conversationId).toBe("88888888-8888-1888-8888-888888888888");
    expect(result.memoryVersion).toBe(1);
    expect(repository.createdConversations).toBe(0);
    expect(repository.createdStates).toBe(0);
  });

  it("creates a new conversation and initial state", async () => {
    const repository = createResolveRepository();
    const service = new ConversationService(repository as never, createCompanyRepository() as never);

    const result = await service.resolveOrCreateConversation({
      companyId: "99999999-9999-1999-8999-999999999999",
      channel: "web",
      externalSessionId: "session-2",
      metadata: {
        runId: "run-1"
      }
    });

    expect(result.created).toBe(true);
    expect(repository.createdConversations).toBe(1);
    expect(repository.createdStates).toBe(1);
    expect(repository.state?.metadata).toEqual({ runId: "run-1" });
  });

  it("handles concurrent conversation creation by rereading the existing record", async () => {
    const repository = createResolveRepository({ throwUniqueOnCreateConversation: true });
    const service = new ConversationService(repository as never, createCompanyRepository() as never);

    const result = await service.resolveOrCreateConversation({
      companyId: "99999999-9999-1999-8999-999999999999",
      channel: "web",
      externalSessionId: "session-3"
    });

    expect(result.created).toBe(false);
    expect(result.conversationId).toBe("88888888-8888-1888-8888-888888888888");
  });

  it("does not reuse a conversation from another channel or empty external session", async () => {
    const repository = createResolveRepository({
      conversation: createConversationRecord({ channel: "other-channel", external_session_id: "session-4" })
    });
    const service = new ConversationService(repository as never, createCompanyRepository() as never);

    const result = await service.resolveOrCreateConversation({
      companyId: "99999999-9999-1999-8999-999999999999",
      channel: "web",
      externalSessionId: "session-4"
    });

    expect(result.created).toBe(true);
    await expect(
      service.resolveOrCreateConversation({
        companyId: "99999999-9999-1999-8999-999999999999",
        channel: "web",
        externalSessionId: ""
      })
    ).rejects.toThrow();
  });
});

function createCompanyRepository() {
  return {
    async findCompanyById() {
      return {
        id: "99999999-9999-1999-8999-999999999999",
        active: true
      };
    }
  };
}

function createConversationRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "88888888-8888-1888-8888-888888888888",
    company_id: "99999999-9999-1999-8999-999999999999",
    channel: "web",
    external_session_id: "session-1",
    source_listing_id: null,
    source_property_id: null,
    source_property_unit_id: null,
    current_sales_stage: "NEW",
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
    updated_at: "2026-07-12T00:00:00.000Z",
    ...overrides
  };
}

function createStateRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa",
    conversation_id: "88888888-8888-1888-8888-888888888888",
    company_id: "99999999-9999-1999-8999-999999999999",
    customer_name: null,
    phone: null,
    email: null,
    preferred_contact_method: null,
    preferred_locations: [],
    rejected_locations: [],
    bedrooms: null,
    bathrooms: null,
    parking_spaces: null,
    property_types: [],
    minimum_area_m2: null,
    maximum_budget: null,
    currency: null,
    important_amenities: [],
    delivery_preference: null,
    purchase_purpose: null,
    financing_required: null,
    purchase_timeline: null,
    main_objections: [],
    lead_temperature: "cold",
    sales_stage: "NEW",
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
    updated_at: "2026-07-12T00:00:00.000Z",
    ...overrides
  };
}

function createResolveRepository(options: {
  conversation?: ReturnType<typeof createConversationRecord>;
  state?: ReturnType<typeof createStateRecord> | null;
  throwUniqueOnCreateConversation?: boolean;
} = {}) {
  const repository = {
    conversation: options.conversation ?? null,
    state: options.state ?? null,
    createdConversations: 0,
    createdStates: 0,
    async findByExternalSession(params: { companyId: string; channel: string; externalSessionId: string }) {
      if (
        this.conversation &&
        this.conversation.company_id === params.companyId &&
        this.conversation.channel === params.channel &&
        this.conversation.external_session_id === params.externalSessionId
      ) {
        return this.conversation;
      }

      return null;
    },
    async createConversation(payload: Record<string, unknown>) {
      this.createdConversations += 1;

      if (options.throwUniqueOnCreateConversation) {
        this.conversation = createConversationRecord({
          channel: payload.channel,
          external_session_id: payload.external_session_id
        });
        throw new ServiceException("DATABASE_ERROR", "duplicate", { code: "23505" });
      }

      this.conversation = createConversationRecord({
        channel: payload.channel,
        external_session_id: payload.external_session_id,
        metadata: payload.metadata ?? {}
      });

      return this.conversation;
    },
    async findState() {
      return this.state;
    },
    async createConversationState(payload: Record<string, unknown>) {
      this.createdStates += 1;
      this.state = createStateRecord({
        metadata: payload.metadata ?? {},
        source_channel: payload.source_channel
      });

      return this.state;
    }
  };

  return repository;
}

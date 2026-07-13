import {
  humanHandoffInputSchema,
  humanHandoffResponseSchema,
  type HumanHandoffInput,
  type HumanHandoffResponse
} from "@real-estate-agent/shared";
import { getRunIdFromMetadata, withRunIdMetadata } from "../testing/run-id";
import type { ConversationRepository } from "../repositories/conversation.repository";
import type { EventRepository } from "../repositories/event.repository";
import type { LeadRepository } from "../repositories/lead.repository";
import type { OwnershipValidator } from "./ownership-validator";

function isDuplicateHandoff(eventPayload: Record<string, unknown>, input: HumanHandoffInput): boolean {
  return (
    eventPayload.reason === input.reason &&
    (eventPayload.note ?? null) === (input.note ?? null) &&
    (eventPayload.propertyId ?? null) === (input.propertyId ?? null) &&
    (eventPayload.unitId ?? null) === (input.unitId ?? null) &&
    (eventPayload.listingId ?? null) === (input.listingId ?? null)
  );
}

export class HumanHandoffService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly leadRepository: LeadRepository,
    private readonly eventRepository: EventRepository,
    private readonly ownershipValidator: OwnershipValidator
  ) {}

  async requestHumanHandoff(input: HumanHandoffInput): Promise<HumanHandoffResponse> {
    const parsed = humanHandoffInputSchema.parse(input);
    const validated = await this.ownershipValidator.validate({
      companyId: parsed.companyId,
      conversationId: parsed.conversationId,
      propertyId: parsed.propertyId,
      unitId: parsed.unitId,
      listingId: parsed.listingId
    });

    if (parsed.idempotencyKey) {
      const existingEvent = await this.eventRepository.findHandoffByIdempotencyKey(parsed.conversationId, parsed.idempotencyKey);

      if (existingEvent) {
        return humanHandoffResponseSchema.parse({
          eventId: existingEvent.id,
          companyId: parsed.companyId,
          conversationId: parsed.conversationId,
          salesStage: "HUMAN_HANDOFF",
          handoffRequested: true,
          handoffReason: parsed.reason,
          leadId: typeof existingEvent.event_payload === "object" && existingEvent.event_payload && "leadId" in existingEvent.event_payload
            ? (existingEvent.event_payload.leadId as string | null) ?? null
            : null,
          createdLead: false,
          note: parsed.note ?? null,
          createdAt: existingEvent.created_at
        });
      }
    }

    const recentEvents = await this.eventRepository.listByConversationAndType(parsed.conversationId, "handoff_requested");
    const duplicateEvent = recentEvents.find((event) =>
      typeof event.event_payload === "object" &&
      event.event_payload &&
      isDuplicateHandoff(event.event_payload as Record<string, unknown>, parsed)
    );

    if (duplicateEvent) {
      return humanHandoffResponseSchema.parse({
        eventId: duplicateEvent.id,
        companyId: parsed.companyId,
        conversationId: parsed.conversationId,
        salesStage: "HUMAN_HANDOFF",
        handoffRequested: true,
        handoffReason: parsed.reason,
        leadId: typeof duplicateEvent.event_payload === "object" && duplicateEvent.event_payload && "leadId" in duplicateEvent.event_payload
          ? (duplicateEvent.event_payload.leadId as string | null) ?? null
          : null,
        createdLead: false,
        note: parsed.note ?? null,
        createdAt: duplicateEvent.created_at
      });
    }

    const conversation = validated.conversation ?? (await this.conversationRepository.findConversationById(parsed.conversationId));
    const runId = getRunIdFromMetadata(conversation.metadata);
    const state = await this.conversationRepository.findState(parsed.conversationId);

    if (state) {
      await this.conversationRepository.updateState(parsed.conversationId, {
        sales_stage: "HUMAN_HANDOFF",
        handoff_requested: true,
        handoff_reason: parsed.reason,
        active_property_id: parsed.propertyId ?? state.active_property_id,
        active_property_unit_id: parsed.unitId ?? state.active_property_unit_id,
        source_listing_id: parsed.listingId ?? state.source_listing_id,
        source_property_id: parsed.propertyId ?? state.source_property_id,
        conversation_summary: parsed.note ?? state.conversation_summary,
        memory_version: state.memory_version + 1
      });
    } else {
      await this.conversationRepository.upsertState({
        conversation_id: parsed.conversationId,
        company_id: parsed.companyId,
        sales_stage: "HUMAN_HANDOFF",
        handoff_requested: true,
        handoff_reason: parsed.reason,
        active_property_id: parsed.propertyId,
        active_property_unit_id: parsed.unitId,
        source_listing_id: parsed.listingId,
        source_property_id: parsed.propertyId,
        conversation_summary: parsed.note
      });
    }

    await this.conversationRepository.updateConversation(parsed.conversationId, {
      current_sales_stage: "HUMAN_HANDOFF",
      source_listing_id: parsed.listingId ?? conversation.source_listing_id,
      source_property_id: parsed.propertyId ?? conversation.source_property_id,
      last_message_at: new Date().toISOString()
    });

    const conversationState = await this.conversationRepository.findState(parsed.conversationId);
    const snapshot = {
      fullName: parsed.contact?.fullName ?? conversationState?.customer_name ?? conversation.customer_display_name ?? undefined,
      phone: parsed.contact?.phone ?? conversationState?.phone ?? undefined,
      email: parsed.contact?.email ?? conversationState?.email ?? undefined,
      preferredContactMethod:
        parsed.contact?.preferredContactMethod ?? conversationState?.preferred_contact_method ?? conversation.preferred_contact_method ?? undefined
    };

    let leadId: string | null = null;
    let createdLead = false;

    if (snapshot.phone || snapshot.email) {
      const existingLead =
        (await this.leadRepository.findExistingLead({ conversationId: parsed.conversationId })) ??
        (await this.leadRepository.findByContact(parsed.companyId, {
          phone: snapshot.phone,
          email: snapshot.email
        }));

      const lead = existingLead
        ? await this.leadRepository.update(existingLead.id, {
            conversation_id: parsed.conversationId,
            source_listing_id: parsed.listingId ?? existingLead.source_listing_id,
            source_property_id: parsed.propertyId ?? existingLead.source_property_id,
            source_property_unit_id: parsed.unitId ?? existingLead.source_property_unit_id,
            full_name: snapshot.fullName ?? existingLead.full_name,
            phone: snapshot.phone ?? existingLead.phone,
            email: snapshot.email ?? existingLead.email,
            preferred_contact_method: snapshot.preferredContactMethod ?? existingLead.preferred_contact_method,
            sales_stage: "HUMAN_HANDOFF",
            handoff_reason: parsed.reason,
            metadata: withRunIdMetadata(existingLead.metadata, runId)
          })
        : await this.leadRepository.insert({
            company_id: parsed.companyId,
            conversation_id: parsed.conversationId,
            source_listing_id: parsed.listingId,
            source_property_id: parsed.propertyId,
            source_property_unit_id: parsed.unitId,
            full_name: snapshot.fullName,
            phone: snapshot.phone,
            email: snapshot.email,
            preferred_contact_method: snapshot.preferredContactMethod,
            preferred_locations: conversationState?.preferred_locations ?? [],
            maximum_budget: conversationState?.maximum_budget ?? null,
            currency: conversationState?.currency ?? null,
            purchase_purpose: conversationState?.purchase_purpose ?? null,
            financing_required: conversationState?.financing_required ?? null,
            lead_temperature: conversationState?.lead_temperature ?? "warm",
            sales_stage: "HUMAN_HANDOFF",
            interest_summary: parsed.note,
            handoff_reason: parsed.reason,
            metadata: withRunIdMetadata(undefined, runId)
          });

      leadId = lead.id;
      createdLead = !existingLead;
    }

    const event = await this.eventRepository.insert({
      company_id: parsed.companyId,
      conversation_id: parsed.conversationId,
      lead_id: leadId,
      property_id: parsed.propertyId,
      property_unit_id: parsed.unitId,
      sales_stage: "HUMAN_HANDOFF",
      event_type: "handoff_requested",
      event_name: "internal_human_handoff_requested",
      event_payload: {
        ...(runId ? { runId } : {}),
        reason: parsed.reason,
        note: parsed.note ?? null,
        propertyId: parsed.propertyId ?? null,
        unitId: parsed.unitId ?? null,
        listingId: parsed.listingId ?? null,
        idempotencyKey: parsed.idempotencyKey ?? null,
        leadId
      }
    });

    return humanHandoffResponseSchema.parse({
      eventId: event.id,
      companyId: parsed.companyId,
      conversationId: parsed.conversationId,
      salesStage: "HUMAN_HANDOFF",
      handoffRequested: true,
      handoffReason: parsed.reason,
      leadId,
      createdLead,
      note: parsed.note ?? null,
      createdAt: event.created_at
    });
  }
}

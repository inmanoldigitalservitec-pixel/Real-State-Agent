import {
  conversationContextResultSchema,
  conversationMemorySchema,
  conversationStatePatchSchema,
  saveMessageInputSchema,
  type ConversationContextResult,
  type ConversationMemory,
  type ConversationStatePatch,
  type SaveMessageInput
} from "@real-estate-agent/shared";
import type { Json } from "../infrastructure/supabase/types";
import { ServiceException } from "../lib/errors/service-error";
import type { ConversationRepository } from "../repositories/conversation.repository";

function mergeArrays<T>(existing: T[], incoming?: T[]): T[] {
  if (!incoming) {
    return existing;
  }

  return Array.from(new Set([...existing, ...incoming]));
}

export class ConversationService {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async getConversationContext(conversationId: string, messageLimit = 20): Promise<ConversationContextResult> {
    const [conversation, state, messages] = await Promise.all([
      this.conversationRepository.findConversationById(conversationId),
      this.conversationRepository.findState(conversationId),
      this.conversationRepository.findMessages(conversationId, messageLimit)
    ]);

    return conversationContextResultSchema.parse({
      conversationId: conversation.id,
      currentSalesStage: conversation.current_sales_stage,
      summary: conversation.summary,
      sourceListingId: conversation.source_listing_id,
      sourcePropertyId: conversation.source_property_id,
      sourcePropertyUnitId: conversation.source_property_unit_id,
      memory: state
        ? conversationMemorySchema.parse({
            conversationId: state.conversation_id,
            companyId: state.company_id,
            customerName: state.customer_name,
            phone: state.phone,
            email: state.email,
            preferredContactMethod: state.preferred_contact_method,
            preferredLocations: state.preferred_locations,
            rejectedLocations: state.rejected_locations,
            bedrooms: state.bedrooms,
            bathrooms: state.bathrooms,
            parkingSpaces: state.parking_spaces,
            propertyTypes: state.property_types,
            minimumAreaM2: state.minimum_area_m2,
            maximumBudget: state.maximum_budget,
            currency: state.currency,
            importantAmenities: state.important_amenities,
            deliveryPreference: state.delivery_preference,
            purchasePurpose: state.purchase_purpose,
            financingRequired: state.financing_required,
            purchaseTimeline: state.purchase_timeline,
            mainObjections: state.main_objections,
            leadTemperature: state.lead_temperature,
            salesStage: state.sales_stage,
            activePropertyId: state.active_property_id,
            activePropertyUnitId: state.active_property_unit_id,
            interestedPropertyIds: state.interested_property_ids,
            recommendedPropertyIds: state.recommended_property_ids,
            viewedPropertyIds: state.viewed_property_ids,
            rejectedPropertyIds: state.rejected_property_ids,
            recentPropertyIds: state.recent_property_ids,
            sentAssetIds: state.sent_asset_ids,
            sentBrochureIds: state.sent_brochure_ids,
            sentFloorPlanIds: state.sent_floor_plan_ids,
            sentPaymentPlanIds: state.sent_payment_plan_ids,
            lastCustomerIntent: state.last_customer_intent,
            lastAgentQuestion: state.last_agent_question,
            pendingQuestion: state.pending_question,
            conversationSummary: state.conversation_summary,
            sourceChannel: state.source_channel,
            sourceListingId: state.source_listing_id,
            sourcePropertyId: state.source_property_id,
            visitRequested: state.visit_requested,
            preferredVisitDate: state.preferred_visit_date,
            preferredVisitTime: state.preferred_visit_time,
            handoffRequested: state.handoff_requested,
            handoffReason: state.handoff_reason,
            assignedAgent: state.assigned_agent,
            memoryVersion: state.memory_version
          })
        : null,
      messages: messages
        .reverse()
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          salesStage: message.sales_stage,
          toolName: message.tool_name,
          assetIds: message.asset_ids,
          createdAt: message.created_at
        }))
    });
  }

  async updateConversationState(conversationId: string, patch: ConversationStatePatch): Promise<ConversationMemory> {
    const parsedPatch = conversationStatePatchSchema.parse(patch);
    const conversation = await this.conversationRepository.findConversationById(conversationId);
    const existing = await this.conversationRepository.findState(conversationId);

    if (!existing) {
      throw new ServiceException("NOT_FOUND", `Conversation state for ${conversationId} not found`);
    }

    const mergedPatch = {
      customer_name: parsedPatch.customerName ?? existing.customer_name,
      phone: parsedPatch.phone ?? existing.phone,
      email: parsedPatch.email ?? existing.email,
      preferred_contact_method: parsedPatch.preferredContactMethod ?? existing.preferred_contact_method,
      preferred_locations: mergeArrays(existing.preferred_locations, parsedPatch.preferredLocations),
      rejected_locations: mergeArrays(existing.rejected_locations, parsedPatch.rejectedLocations),
      bedrooms: parsedPatch.bedrooms ?? existing.bedrooms,
      bathrooms: parsedPatch.bathrooms ?? existing.bathrooms,
      parking_spaces: parsedPatch.parkingSpaces ?? existing.parking_spaces,
      property_types: mergeArrays(existing.property_types, parsedPatch.propertyTypes),
      minimum_area_m2: parsedPatch.minimumAreaM2 ?? existing.minimum_area_m2,
      maximum_budget: parsedPatch.maximumBudget ?? existing.maximum_budget,
      currency: parsedPatch.currency ?? existing.currency,
      important_amenities: mergeArrays(existing.important_amenities, parsedPatch.importantAmenities),
      delivery_preference: parsedPatch.deliveryPreference ?? existing.delivery_preference,
      purchase_purpose: parsedPatch.purchasePurpose ?? existing.purchase_purpose,
      financing_required: parsedPatch.financingRequired ?? existing.financing_required,
      purchase_timeline: parsedPatch.purchaseTimeline ?? existing.purchase_timeline,
      main_objections: mergeArrays(existing.main_objections, parsedPatch.mainObjections),
      lead_temperature: parsedPatch.leadTemperature ?? existing.lead_temperature,
      sales_stage: parsedPatch.salesStage ?? existing.sales_stage,
      active_property_id: parsedPatch.activePropertyId ?? existing.active_property_id,
      active_property_unit_id: parsedPatch.activePropertyUnitId ?? existing.active_property_unit_id,
      interested_property_ids: mergeArrays(existing.interested_property_ids, parsedPatch.interestedPropertyIds),
      recommended_property_ids: mergeArrays(existing.recommended_property_ids, parsedPatch.recommendedPropertyIds),
      viewed_property_ids: mergeArrays(existing.viewed_property_ids, parsedPatch.viewedPropertyIds),
      rejected_property_ids: mergeArrays(existing.rejected_property_ids, parsedPatch.rejectedPropertyIds),
      recent_property_ids: mergeArrays(existing.recent_property_ids, parsedPatch.recentPropertyIds),
      sent_asset_ids: mergeArrays(existing.sent_asset_ids, parsedPatch.sentAssetIds),
      sent_brochure_ids: mergeArrays(existing.sent_brochure_ids, parsedPatch.sentBrochureIds),
      sent_floor_plan_ids: mergeArrays(existing.sent_floor_plan_ids, parsedPatch.sentFloorPlanIds),
      sent_payment_plan_ids: mergeArrays(existing.sent_payment_plan_ids, parsedPatch.sentPaymentPlanIds),
      last_customer_intent: parsedPatch.lastCustomerIntent ?? existing.last_customer_intent,
      last_agent_question: parsedPatch.lastAgentQuestion ?? existing.last_agent_question,
      pending_question: parsedPatch.pendingQuestion ?? existing.pending_question,
      conversation_summary: parsedPatch.conversationSummary ?? existing.conversation_summary,
      source_listing_id: parsedPatch.sourceListingId ?? existing.source_listing_id,
      source_property_id: parsedPatch.sourcePropertyId ?? existing.source_property_id,
      visit_requested: parsedPatch.visitRequested ?? existing.visit_requested,
      preferred_visit_date: parsedPatch.preferredVisitDate ?? existing.preferred_visit_date,
      preferred_visit_time: parsedPatch.preferredVisitTime ?? existing.preferred_visit_time,
      handoff_requested: parsedPatch.handoffRequested ?? existing.handoff_requested,
      handoff_reason: parsedPatch.handoffReason ?? existing.handoff_reason,
      assigned_agent: parsedPatch.assignedAgent ?? existing.assigned_agent,
      memory_version: existing.memory_version + 1
    };

    const updated = await this.conversationRepository.updateState(conversationId, mergedPatch);
    await this.conversationRepository.updateConversation(conversationId, {
      current_sales_stage: updated.sales_stage,
      summary: updated.conversation_summary,
      source_listing_id: updated.source_listing_id,
      source_property_id: updated.source_property_id,
      last_message_at: new Date().toISOString()
    });

    return this.getConversationContext(conversation.id).then((context) => {
      if (!context.memory) {
        throw new ServiceException("UNEXPECTED_ERROR", "Updated conversation state did not return memory");
      }

      return context.memory;
    });
  }

  async saveMessage(input: SaveMessageInput) {
    const parsed = saveMessageInputSchema.parse(input);
    const message = await this.conversationRepository.insertMessage({
      conversation_id: parsed.conversationId,
      company_id: parsed.companyId,
      role: parsed.role,
      content: parsed.content,
      sales_stage: parsed.salesStage,
      client_message_id: parsed.clientMessageId,
      tool_name: parsed.toolName,
      raw_payload: parsed.rawPayload as Json | undefined,
      ui_payload: parsed.uiPayload as Json | undefined,
      asset_ids: parsed.assetIds
    });

    await this.conversationRepository.updateConversation(parsed.conversationId, {
      last_message_at: message.created_at,
      current_sales_stage: parsed.salesStage
    });

    return message;
  }
}

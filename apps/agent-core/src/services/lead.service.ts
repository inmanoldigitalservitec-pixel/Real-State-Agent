import { leadCaptureInputSchema, type LeadCaptureInput } from "@real-estate-agent/shared";
import type { LeadRepository } from "../repositories/lead.repository";

export class LeadService {
  constructor(private readonly leadRepository: LeadRepository) {}

  async captureLead(input: LeadCaptureInput) {
    const parsed = leadCaptureInputSchema.parse(input);
    const existing = await this.leadRepository.findExistingLead({
      conversationId: parsed.conversationId,
      phone: parsed.phone,
      sourcePropertyId: parsed.sourcePropertyId
    });

    if (existing) {
      return this.leadRepository.update(existing.id, {
        full_name: parsed.fullName ?? existing.full_name,
        phone: parsed.phone ?? existing.phone,
        email: parsed.email ?? existing.email,
        preferred_contact_method: parsed.preferredContactMethod ?? existing.preferred_contact_method,
        preferred_locations: parsed.preferredLocations ?? existing.preferred_locations,
        maximum_budget: parsed.maximumBudget ?? existing.maximum_budget,
        currency: parsed.currency ?? existing.currency,
        purchase_purpose: parsed.purchasePurpose ?? existing.purchase_purpose,
        financing_required: parsed.financingRequired ?? existing.financing_required,
        lead_temperature: parsed.leadTemperature ?? existing.lead_temperature,
        sales_stage: parsed.salesStage ?? existing.sales_stage,
        interest_summary: parsed.interestSummary ?? existing.interest_summary,
        handed_off_to: parsed.handedOffTo ?? existing.handed_off_to,
        handoff_reason: parsed.handoffReason ?? existing.handoff_reason
      });
    }

    return this.leadRepository.insert({
      company_id: parsed.companyId,
      conversation_id: parsed.conversationId,
      source_listing_id: parsed.sourceListingId,
      source_property_id: parsed.sourcePropertyId,
      source_property_unit_id: parsed.sourcePropertyUnitId,
      full_name: parsed.fullName,
      phone: parsed.phone,
      email: parsed.email,
      preferred_contact_method: parsed.preferredContactMethod,
      preferred_locations: parsed.preferredLocations ?? [],
      maximum_budget: parsed.maximumBudget,
      currency: parsed.currency,
      purchase_purpose: parsed.purchasePurpose,
      financing_required: parsed.financingRequired,
      lead_temperature: parsed.leadTemperature ?? "warm",
      sales_stage: parsed.salesStage ?? "INQUIRY",
      interest_summary: parsed.interestSummary,
      handed_off_to: parsed.handedOffTo,
      handoff_reason: parsed.handoffReason
    });
  }
}

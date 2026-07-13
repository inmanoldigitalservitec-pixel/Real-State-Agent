import { leadCaptureInputSchema, leadResponseSchema, type LeadCaptureInput, type LeadResponse } from "@real-estate-agent/shared";
import { getRunIdFromMetadata, withRunIdMetadata } from "../testing/run-id";
import type { LeadRepository } from "../repositories/lead.repository";
import type { OwnershipValidator } from "./ownership-validator";

export class LeadService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly ownershipValidator: OwnershipValidator
  ) {}

  async captureLead(input: LeadCaptureInput): Promise<LeadResponse> {
    const parsed = leadCaptureInputSchema.parse(input);
    const validated = await this.ownershipValidator.validate({
      companyId: parsed.companyId,
      conversationId: parsed.conversationId,
      propertyId: parsed.sourcePropertyId,
      unitId: parsed.sourcePropertyUnitId,
      listingId: parsed.sourceListingId
    });
    const runId = getRunIdFromMetadata(validated.conversation?.metadata);
    const existing = await this.leadRepository.findExistingLead({
      conversationId: parsed.conversationId,
      phone: parsed.phone,
      sourcePropertyId: parsed.sourcePropertyId
    });
    const record = existing
      ? await this.leadRepository.update(existing.id, {
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
          handoff_reason: parsed.handoffReason ?? existing.handoff_reason,
          metadata: withRunIdMetadata(existing.metadata, runId)
        })
      : await this.leadRepository.insert({
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
          handoff_reason: parsed.handoffReason,
          metadata: withRunIdMetadata(undefined, runId)
        });

    return leadResponseSchema.parse({
      id: record.id,
      companyId: record.company_id,
      conversationId: record.conversation_id,
      sourcePropertyId: record.source_property_id,
      sourcePropertyUnitId: record.source_property_unit_id,
      sourceListingId: record.source_listing_id,
      fullName: record.full_name,
      phone: record.phone,
      email: record.email,
      preferredContactMethod: record.preferred_contact_method,
      preferredLocations: record.preferred_locations,
      maximumBudget: record.maximum_budget,
      currency: record.currency,
      purchasePurpose: record.purchase_purpose,
      financingRequired: record.financing_required,
      leadTemperature: record.lead_temperature,
      salesStage: record.sales_stage,
      handoffReason: record.handoff_reason,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  }
}

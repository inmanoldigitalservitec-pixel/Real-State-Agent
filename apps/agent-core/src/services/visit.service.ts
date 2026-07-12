import { visitRequestInputSchema, type VisitRequestInput } from "@real-estate-agent/shared";
import type { VisitRepository } from "../repositories/visit.repository";

export class VisitService {
  constructor(private readonly visitRepository: VisitRepository) {}

  async requestVisit(input: VisitRequestInput) {
    const parsed = visitRequestInputSchema.parse(input);

    return this.visitRepository.insert({
      company_id: parsed.companyId,
      conversation_id: parsed.conversationId,
      lead_id: parsed.leadId,
      development_id: parsed.developmentId,
      property_id: parsed.propertyId,
      property_unit_id: parsed.propertyUnitId,
      customer_name: parsed.customerName,
      phone: parsed.phone,
      email: parsed.email,
      preferred_date: parsed.preferredDate,
      preferred_time_window: parsed.preferredTimeWindow,
      status: "requested",
      notes: parsed.notes,
      handoff_required: true,
      assigned_agent: parsed.assignedAgent
    });
  }
}

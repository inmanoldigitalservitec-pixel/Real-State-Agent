import { visitRequestInputSchema, visitResponseSchema, type VisitRequestInput, type VisitResponse } from "@real-estate-agent/shared";
import { getRunIdFromMetadata } from "../testing/run-id";
import type { VisitRepository } from "../repositories/visit.repository";
import type { OwnershipValidator } from "./ownership-validator";

export class VisitService {
  constructor(
    private readonly visitRepository: VisitRepository,
    private readonly ownershipValidator: OwnershipValidator
  ) {}

  async requestVisit(input: VisitRequestInput): Promise<VisitResponse> {
    const parsed = visitRequestInputSchema.parse(input);
    const validated = await this.ownershipValidator.validate({
      companyId: parsed.companyId,
      conversationId: parsed.conversationId,
      propertyId: parsed.propertyId,
      unitId: parsed.propertyUnitId
    });
    const runId = getRunIdFromMetadata(validated.conversation?.metadata);

    if (parsed.idempotencyKey) {
      const existing = await this.visitRepository.findByIdempotencyKey(parsed.companyId, parsed.idempotencyKey);

      if (existing) {
        return visitResponseSchema.parse({
          id: existing.id,
          companyId: existing.company_id,
          conversationId: existing.conversation_id,
          leadId: existing.lead_id,
          developmentId: existing.development_id,
          propertyId: existing.property_id,
          propertyUnitId: existing.property_unit_id,
          customerName: existing.customer_name,
          phone: existing.phone,
          email: existing.email,
          preferredDate: existing.preferred_date,
          preferredTimeWindow: existing.preferred_time_window,
          status: existing.status,
          handoffRequired: existing.handoff_required,
          assignedAgent: existing.assigned_agent,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at
        });
      }
    }

    const visit = await this.visitRepository.insert({
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
      assigned_agent: parsed.assignedAgent,
      metadata: {
        ...(runId ? { runId } : {}),
        ...(parsed.idempotencyKey ? { idempotencyKey: parsed.idempotencyKey } : {})
      }
    });

    return visitResponseSchema.parse({
      id: visit.id,
      companyId: visit.company_id,
      conversationId: visit.conversation_id,
      leadId: visit.lead_id,
      developmentId: visit.development_id,
      propertyId: visit.property_id,
      propertyUnitId: visit.property_unit_id,
      customerName: visit.customer_name,
      phone: visit.phone,
      email: visit.email,
      preferredDate: visit.preferred_date,
      preferredTimeWindow: visit.preferred_time_window,
      status: visit.status,
      handoffRequired: visit.handoff_required,
      assignedAgent: visit.assigned_agent,
      createdAt: visit.created_at,
      updatedAt: visit.updated_at
    });
  }
}

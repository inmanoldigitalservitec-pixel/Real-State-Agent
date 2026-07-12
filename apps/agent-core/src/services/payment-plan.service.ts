import { paymentPlanResultSchema, type PaymentPlanResult } from "@real-estate-agent/shared";
import type { PaymentPlanRepository } from "../repositories/payment-plan.repository";

export class PaymentPlanService {
  constructor(private readonly paymentPlanRepository: PaymentPlanRepository) {}

  async getPaymentPlan(params: {
    propertyId?: string;
    developmentId?: string;
    unitId?: string;
  }): Promise<PaymentPlanResult> {
    const plans = await this.paymentPlanRepository.findPlansByScope(params);
    const today = new Date().toISOString().slice(0, 10);
    const confirmed = plans.find(
      (plan) =>
        plan.status === "active" &&
        plan.valid_from <= today &&
        (!plan.valid_to || plan.valid_to >= today) &&
        !!plan.last_verified_at
    );

    if (!confirmed) {
      return paymentPlanResultSchema.parse({
        available: false,
        requiresHumanVerification: true,
        reason: "payment_plan_not_confirmed",
        plan: null
      });
    }

    const items = await this.paymentPlanRepository.findItems(confirmed.id);

    return paymentPlanResultSchema.parse({
      available: true,
      requiresHumanVerification: false,
      reason: null,
      plan: {
        id: confirmed.id,
        propertyId: confirmed.property_id,
        developmentId: confirmed.development_id,
        unitId: confirmed.property_unit_id,
        name: confirmed.name,
        description: confirmed.description,
        currency: confirmed.currency,
        validFrom: confirmed.valid_from,
        validTo: confirmed.valid_to,
        lastVerifiedAt: confirmed.last_verified_at,
        separationAmount: confirmed.separation_amount,
        totalInitialAmount: confirmed.total_initial_amount,
        totalInitialPercentage: confirmed.total_initial_percentage,
        notes: confirmed.notes,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          dueLabel: item.due_label,
          dueType: item.due_type,
          dueDate: item.due_date,
          daysFromReservation: item.days_from_reservation,
          percentage: item.percentage,
          amount: item.amount,
          currency: item.currency,
          sortOrder: item.sort_order
        }))
      }
    });
  }
}

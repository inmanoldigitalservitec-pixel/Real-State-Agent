import { describe, expect, it } from "vitest";
import { PaymentPlanService } from "../../src/services/payment-plan.service";

describe("PaymentPlanService", () => {
  it("returns a confirmed plan only when it is active, in range and verified", async () => {
    const service = new PaymentPlanService({
      async findPlansByScope() {
        return [
          {
            id: "11111111-1111-1111-8111-111111111111",
            company_id: "company",
            development_id: null,
            property_id: "33333333-3333-3333-8333-333333333333",
            property_unit_id: null,
            name: "Plan vigente",
            description: null,
            currency: "DOP",
            status: "active",
            valid_from: "2026-01-01",
            valid_to: "2026-12-31",
            last_verified_at: "2026-07-12T00:00:00.000Z",
            separation_amount: 100000,
            total_initial_amount: 1500000,
            total_initial_percentage: 25,
            notes: null,
            metadata: {},
            created_at: "2026-07-12T00:00:00.000Z",
            updated_at: "2026-07-12T00:00:00.000Z"
          }
        ];
      },
      async findItems() {
        return [
          {
            id: "22222222-2222-2222-8222-222222222222",
            payment_plan_id: "11111111-1111-1111-8111-111111111111",
            name: "Separacion",
            description: null,
            due_label: "Hoy",
            due_type: "reservation",
            due_date: null,
            days_from_reservation: 0,
            percentage: null,
            amount: 100000,
            currency: "DOP",
            sort_order: 1,
            metadata: {},
            created_at: "2026-07-12T00:00:00.000Z",
            updated_at: "2026-07-12T00:00:00.000Z"
          }
        ];
      }
    } as never);

    const result = await service.getPaymentPlan({ propertyId: "33333333-3333-3333-8333-333333333333" });

    expect(result.available).toBe(true);
    expect(result.requiresHumanVerification).toBe(false);
    expect(result.plan?.items).toHaveLength(1);
  });

  it("rejects expired or unverified plans", async () => {
    const service = new PaymentPlanService({
      async findPlansByScope() {
        return [
          {
            id: "11111111-1111-1111-8111-111111111111",
            company_id: "company",
            development_id: null,
            property_id: "33333333-3333-3333-8333-333333333333",
            property_unit_id: null,
            name: "Plan expirado",
            description: null,
            currency: "DOP",
            status: "expired",
            valid_from: "2026-01-01",
            valid_to: "2026-03-01",
            last_verified_at: "2026-01-05T00:00:00.000Z",
            separation_amount: null,
            total_initial_amount: null,
            total_initial_percentage: null,
            notes: null,
            metadata: {},
            created_at: "2026-07-12T00:00:00.000Z",
            updated_at: "2026-07-12T00:00:00.000Z"
          }
        ];
      },
      async findItems() {
        return [];
      }
    } as never);

    const result = await service.getPaymentPlan({ propertyId: "33333333-3333-3333-8333-333333333333" });

    expect(result.available).toBe(false);
    expect(result.requiresHumanVerification).toBe(true);
    expect(result.reason).toBe("payment_plan_not_confirmed");
  });
});

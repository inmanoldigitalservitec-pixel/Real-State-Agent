import { describe, expect, it } from "vitest";
import { VisitService } from "../../src/services/visit.service";

describe("VisitService", () => {
  it("returns an existing visit when idempotencyKey matches", async () => {
    let inserted = false;
    const service = new VisitService(
      {
        async findByIdempotencyKey() {
          return {
            id: "11111111-1111-1111-1111-111111111111",
            company_id: "55555555-5555-5555-5555-555555555555",
            conversation_id: "66666666-6666-6666-6666-666666666666",
            lead_id: null,
            development_id: null,
            property_id: "77777777-7777-7777-7777-777777777777",
            property_unit_id: null,
            customer_name: "Laura",
            phone: "809",
            email: null,
            preferred_date: null,
            preferred_time_window: null,
            status: "requested",
            notes: null,
            handoff_required: true,
            assigned_agent: null,
            metadata: { idempotencyKey: "visit-key" },
            created_at: "2026-07-12T00:00:00.000Z",
            updated_at: "2026-07-12T00:00:00.000Z"
          };
        },
        async insert() {
          inserted = true;
          throw new Error("insert should not be called");
        }
      } as never,
      {
        async validate() {
          return {};
        }
      } as never
    );

    const visit = await service.requestVisit({
      companyId: "55555555-5555-5555-5555-555555555555",
      conversationId: "66666666-6666-6666-6666-666666666666",
      propertyId: "77777777-7777-7777-7777-777777777777",
      customerName: "Laura",
      phone: "809",
      idempotencyKey: "visit-key"
    });

    expect(inserted).toBe(false);
    expect(visit.id).toBe("11111111-1111-1111-1111-111111111111");
  });
});

import { describe, expect, it } from "vitest";
import { HumanHandoffService } from "../../src/services/human-handoff.service";

describe("HumanHandoffService", () => {
  it("returns existing handoff event when idempotencyKey matches", async () => {
    const service = new HumanHandoffService(
      {} as never,
      {} as never,
      {
        async findHandoffByIdempotencyKey() {
          return {
            id: "11111111-1111-1111-1111-111111111111",
            event_payload: {
              leadId: "22222222-2222-2222-2222-222222222222"
            },
            created_at: "2026-07-12T00:00:00.000Z"
          };
        }
      } as never,
      {
        async validate() {
          return {
            conversation: {
              id: "conversation",
              company_id: "company"
            }
          };
        }
      } as never
    );

    const response = await service.requestHumanHandoff({
      companyId: "55555555-5555-5555-5555-555555555555",
      conversationId: "66666666-6666-6666-6666-666666666666",
      reason: "requested_by_customer",
      idempotencyKey: "handoff-key"
    });

    expect(response.eventId).toBe("11111111-1111-1111-1111-111111111111");
    expect(response.createdLead).toBe(false);
  });
});

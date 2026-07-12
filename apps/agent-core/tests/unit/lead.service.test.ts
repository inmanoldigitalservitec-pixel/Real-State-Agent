import { describe, expect, it } from "vitest";
import { LeadService } from "../../src/services/lead.service";

describe("LeadService", () => {
  it("updates an existing lead instead of duplicating it", async () => {
    let updated = false;

    const service = new LeadService({
      async findExistingLead() {
        return {
          id: "lead-1",
          company_id: "company",
          conversation_id: "conversation",
          source_listing_id: null,
          source_property_id: "property",
          source_property_unit_id: null,
          full_name: "Laura",
          phone: "809",
          email: null,
          preferred_contact_method: "whatsapp",
          preferred_locations: [],
          maximum_budget: null,
          currency: null,
          purchase_purpose: null,
          financing_required: null,
          lead_temperature: "warm",
          sales_stage: "INQUIRY",
          status: "new",
          interest_summary: null,
          handed_off_to: null,
          handoff_reason: null,
          metadata: {},
          created_at: "2026-07-12T00:00:00.000Z",
          updated_at: "2026-07-12T00:00:00.000Z"
        };
      },
      async update() {
        updated = true;
        return { id: "lead-1" };
      },
      async insert() {
        throw new Error("insert should not be called");
      }
    } as never);

    await service.captureLead({
      companyId: "55555555-5555-5555-8555-555555555555",
      conversationId: "66666666-6666-6666-8666-666666666666",
      sourcePropertyId: "77777777-7777-7777-8777-777777777777",
      phone: "809-555-0000",
      fullName: "Laura Perez"
    });

    expect(updated).toBe(true);
  });
});

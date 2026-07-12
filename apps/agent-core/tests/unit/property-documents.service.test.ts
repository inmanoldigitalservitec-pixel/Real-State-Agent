import { describe, expect, it, vi } from "vitest";
import { PropertyDocumentsService } from "../../src/services/property-documents.service";

describe("PropertyDocumentsService", () => {
  it("excludes expired documents and removes duplicates across inherited scopes", async () => {
    const documentRepository = {
      findByScope: vi.fn(async () => [
        {
          id: "11111111-1111-1111-8111-111111111111",
          company_id: "company",
          development_id: null,
          property_id: "33333333-3333-3333-8333-333333333333",
          property_unit_id: null,
          bucket_name: "property-documents",
          storage_path: "project/floor-plan.pdf",
          public_url: "https://cdn.example.com/project/floor-plan.pdf",
          category: "floor_plan",
          title: "Plano vigente",
          mime_type: "application/pdf",
          language: "es",
          version_label: "v1",
          sort_order: 2,
          expires_at: "2027-12-31",
          last_verified_at: "2026-07-12T00:00:00.000Z",
          metadata: {},
          is_active: true,
          created_at: "2026-07-12T00:00:00.000Z",
          updated_at: "2026-07-12T00:00:00.000Z"
        },
        {
          id: "22222222-2222-2222-8222-222222222222",
          company_id: "company",
          development_id: "44444444-4444-4444-8444-444444444444",
          property_id: null,
          property_unit_id: null,
          bucket_name: "property-documents",
          storage_path: "project/brochure.pdf",
          public_url: "https://cdn.example.com/project/brochure.pdf",
          category: "brochure",
          title: "Brochure vigente",
          mime_type: "application/pdf",
          language: "es",
          version_label: "v1",
          sort_order: 1,
          expires_at: "2027-12-31",
          last_verified_at: "2026-07-12T00:00:00.000Z",
          metadata: {},
          is_active: true,
          created_at: "2026-07-12T00:00:00.000Z",
          updated_at: "2026-07-12T00:00:00.000Z"
        },
        {
          id: "33333333-3333-3333-8333-333333333333",
          company_id: "company",
          development_id: null,
          property_id: "33333333-3333-3333-8333-333333333333",
          property_unit_id: null,
          bucket_name: "property-documents",
          storage_path: "project/floor-plan.pdf",
          public_url: "https://cdn.example.com/project/floor-plan.pdf",
          category: "floor_plan",
          title: "Plano duplicado",
          mime_type: "application/pdf",
          language: "es",
          version_label: "v1",
          sort_order: 3,
          expires_at: "2027-12-31",
          last_verified_at: "2026-07-12T00:00:00.000Z",
          metadata: {},
          is_active: true,
          created_at: "2026-07-12T00:00:00.000Z",
          updated_at: "2026-07-12T00:00:00.000Z"
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          company_id: "company",
          development_id: "44444444-4444-4444-8444-444444444444",
          property_id: null,
          property_unit_id: null,
          bucket_name: "property-documents",
          storage_path: "project/expired.pdf",
          public_url: "https://cdn.example.com/project/expired.pdf",
          category: "brochure",
          title: "Brochure vencido",
          mime_type: "application/pdf",
          language: "es",
          version_label: "old",
          sort_order: 4,
          expires_at: "2026-01-01",
          last_verified_at: "2026-01-02T00:00:00.000Z",
          metadata: {},
          is_active: true,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z"
        }
      ])
    };
    const propertyRepository = {
      async findById() {
        return {
          property: {
            id: "33333333-3333-3333-8333-333333333333"
          },
          development: {
            id: "44444444-4444-4444-8444-444444444444"
          }
        };
      }
    };

    const service = new PropertyDocumentsService(documentRepository as never, propertyRepository as never);
    const result = await service.getPropertyDocuments({
      propertyId: "33333333-3333-3333-8333-333333333333",
      categories: ["brochure", "floor_plan"]
    });

    expect(documentRepository.findByScope).toHaveBeenCalledWith({
      propertyId: "33333333-3333-3333-8333-333333333333",
      unitId: undefined,
      developmentId: "44444444-4444-4444-8444-444444444444",
      categories: ["brochure", "floor_plan"]
    });
    expect(result.map((item) => item.id)).toEqual([
      "11111111-1111-1111-8111-111111111111",
      "22222222-2222-2222-8222-222222222222"
    ]);
    expect(result.map((item) => item.category)).toEqual(["floor_plan", "brochure"]);
  });
});

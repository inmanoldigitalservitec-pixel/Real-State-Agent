import { describe, expect, it } from "vitest";
import { presentPropertyDocument, presentPropertyMediaItem } from "../../src/routes/internal/presenters";

describe("presenters", () => {
  it("sanitizes media DTOs", () => {
    const dto = presentPropertyMediaItem({
      id: "11111111-1111-1111-1111-111111111111",
      propertyId: "22222222-2222-2222-2222-222222222222",
      developmentId: null,
      unitId: null,
      assetType: "image",
      category: "cover_image",
      bucketName: "secret-bucket",
      storagePath: "private/path.jpg",
      publicUrl: "https://cdn.example.com/path.jpg",
      mimeType: "image/jpeg",
      altText: "Alt",
      caption: "Caption",
      sortOrder: 1,
      isPrimary: true,
      lastVerifiedAt: "2026-07-12T00:00:00.000Z"
    });

    expect(dto.publicUrl).toBe("https://cdn.example.com/path.jpg");
    expect("bucketName" in dto).toBe(false);
    expect("storagePath" in dto).toBe(false);
  });

  it("sanitizes document DTOs", () => {
    const dto = presentPropertyDocument({
      id: "11111111-1111-1111-1111-111111111111",
      propertyId: null,
      developmentId: "22222222-2222-2222-2222-222222222222",
      unitId: null,
      category: "brochure",
      title: "Brochure",
      bucketName: "secret-bucket",
      storagePath: "private/brochure.pdf",
      publicUrl: "https://cdn.example.com/brochure.pdf",
      mimeType: "application/pdf",
      versionLabel: "v1",
      expiresAt: "2026-12-31",
      lastVerifiedAt: "2026-07-12T00:00:00.000Z",
      sortOrder: 1
    });

    expect(dto.publicUrl).toBe("https://cdn.example.com/brochure.pdf");
    expect("bucketName" in dto).toBe(false);
    expect("storagePath" in dto).toBe(false);
  });
});

import {
  propertyDocumentSchema,
  propertyDocumentsInputSchema,
  type PropertyDocument,
  type PropertyDocumentsInput
} from "@real-estate-agent/shared";
import type { DocumentRepository } from "../repositories/document.repository";
import type { PropertyRepository } from "../repositories/property.repository";

export class PropertyDocumentsService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly propertyRepository: PropertyRepository
  ) {}

  async getPropertyDocuments(input: PropertyDocumentsInput): Promise<PropertyDocument[]> {
    const parsed = propertyDocumentsInputSchema.parse(input);
    const propertyScope = parsed.propertyId ? await this.propertyRepository.findById(parsed.propertyId) : null;
    const today = new Date().toISOString().slice(0, 10);
    const scopedRows = propertyScope
      ? await this.documentRepository.findByScope({
          propertyId: parsed.propertyId,
          unitId: parsed.unitId,
          developmentId: propertyScope.development.id,
          categories: parsed.categories
        })
      : await this.documentRepository.findByScope(parsed);
    const deduped = new Map<string, typeof scopedRows[number]>();

    for (const row of scopedRows) {
      if (row.expires_at && row.expires_at < today) {
        continue;
      }

      const key = [row.category, row.bucket_name, row.storage_path].join("|");

      if (!deduped.has(key)) {
        deduped.set(key, row);
      }
    }

    return Array.from(deduped.values())
      .sort((left, right) => {
        const leftPriority =
          left.property_unit_id === parsed.unitId && parsed.unitId
            ? 0
            : left.property_id === parsed.propertyId && parsed.propertyId
              ? 1
              : 2;
        const rightPriority =
          right.property_unit_id === parsed.unitId && parsed.unitId
            ? 0
            : right.property_id === parsed.propertyId && parsed.propertyId
              ? 1
              : 2;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return left.sort_order - right.sort_order;
      })
      .map((row) =>
        propertyDocumentSchema.parse({
          id: row.id,
          propertyId: row.property_id,
          developmentId: row.development_id,
          unitId: row.property_unit_id,
          category: row.category,
          title: row.title,
          bucketName: row.bucket_name,
          storagePath: row.storage_path,
          publicUrl: row.public_url,
          mimeType: row.mime_type,
          versionLabel: row.version_label,
          expiresAt: row.expires_at,
          lastVerifiedAt: row.last_verified_at,
          sortOrder: row.sort_order
        })
      );
  }
}

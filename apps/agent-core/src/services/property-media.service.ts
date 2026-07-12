import { propertyMediaItemSchema, type AssetCategory, type PropertyMediaItem } from "@real-estate-agent/shared";
import type { MediaRepository } from "../repositories/media.repository";

export class PropertyMediaService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  async getPropertyMedia(params: {
    propertyId: string;
    categories?: AssetCategory[];
    limit?: number;
  }): Promise<PropertyMediaItem[]> {
    const rows = await this.mediaRepository.findByScope({
      propertyId: params.propertyId,
      categories: params.categories,
      limit: params.limit ?? 10
    });

    return rows.map((row) =>
      propertyMediaItemSchema.parse({
        id: row.id,
        propertyId: row.property_id,
        developmentId: row.development_id,
        unitId: row.property_unit_id,
        assetType: row.asset_type,
        category: row.category,
        bucketName: row.bucket_name,
        storagePath: row.storage_path,
        publicUrl: row.public_url,
        mimeType: row.mime_type,
        altText: row.alt_text,
        caption: row.caption,
        sortOrder: row.sort_order,
        isPrimary: row.is_primary,
        lastVerifiedAt: row.last_verified_at
      })
    );
  }
}

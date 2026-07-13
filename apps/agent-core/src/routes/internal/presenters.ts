import {
  publicPropertyDocumentSchema,
  publicPropertyMediaItemSchema,
  type PropertyDocument,
  type PropertyMediaItem
} from "@real-estate-agent/shared";

export function presentPropertyMediaItem(item: PropertyMediaItem) {
  return publicPropertyMediaItemSchema.parse({
    id: item.id,
    category: item.category,
    altText: item.altText,
    caption: item.caption,
    publicUrl: item.publicUrl,
    mimeType: item.mimeType,
    sortOrder: item.sortOrder,
    verifiedAt: item.lastVerifiedAt
  });
}

export function presentPropertyDocument(item: PropertyDocument) {
  return publicPropertyDocumentSchema.parse({
    id: item.id,
    category: item.category,
    title: item.title,
    publicUrl: item.publicUrl,
    mimeType: item.mimeType,
    sortOrder: item.sortOrder,
    expiresAt: item.expiresAt,
    verifiedAt: item.lastVerifiedAt
  });
}

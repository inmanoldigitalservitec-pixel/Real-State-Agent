import { ServiceException } from "../lib/errors/service-error";
import type { ConversationRepository, ConversationRecord } from "../repositories/conversation.repository";
import type { PropertyRepository, PropertyListingRecord, PropertyRecord, PropertyUnitRecord } from "../repositories/property.repository";

type ValidatedReferences = {
  conversation?: ConversationRecord;
  property?: PropertyRecord;
  unit?: PropertyUnitRecord;
  listing?: PropertyListingRecord;
};

export class OwnershipValidator {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly propertyRepository: PropertyRepository
  ) {}

  async validate(params: {
    companyId: string;
    conversationId?: string;
    propertyId?: string;
    unitId?: string;
    listingId?: string;
  }): Promise<ValidatedReferences> {
    const validated: ValidatedReferences = {};

    if (params.conversationId) {
      const conversation = await this.conversationRepository.findConversationById(params.conversationId);

      if (conversation.company_id !== params.companyId) {
        throw new ServiceException("CONFLICT", `Conversation ${params.conversationId} does not belong to company ${params.companyId}`);
      }

      validated.conversation = conversation;
    }

    if (params.propertyId) {
      const { property } = await this.propertyRepository.findById(params.propertyId);

      if (property.company_id !== params.companyId) {
        throw new ServiceException("CONFLICT", `Property ${params.propertyId} does not belong to company ${params.companyId}`);
      }

      validated.property = property;
    }

    if (params.unitId) {
      const unit = await this.propertyRepository.findUnitById(params.unitId);

      if (unit.company_id !== params.companyId) {
        throw new ServiceException("CONFLICT", `Unit ${params.unitId} does not belong to company ${params.companyId}`);
      }

      if (params.propertyId && unit.property_id !== params.propertyId) {
        throw new ServiceException("CONFLICT", `Unit ${params.unitId} does not belong to property ${params.propertyId}`);
      }

      validated.unit = unit;
    }

    if (params.listingId) {
      const listing = await this.propertyRepository.findListingById(params.listingId);

      if (listing.company_id !== params.companyId) {
        throw new ServiceException("CONFLICT", `Listing ${params.listingId} does not belong to company ${params.companyId}`);
      }

      if (params.propertyId && listing.property_id !== params.propertyId) {
        throw new ServiceException("CONFLICT", `Listing ${params.listingId} does not belong to property ${params.propertyId}`);
      }

      if (params.unitId && listing.property_unit_id !== params.unitId) {
        throw new ServiceException("CONFLICT", `Listing ${params.listingId} does not belong to unit ${params.unitId}`);
      }

      validated.listing = listing;
    }

    return validated;
  }
}

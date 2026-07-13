import { getBackendSupabaseClient } from "../infrastructure/supabase/client";
import { CompanyRepository } from "../repositories/company.repository";
import { ConversationRepository } from "../repositories/conversation.repository";
import { DocumentRepository } from "../repositories/document.repository";
import { EventRepository } from "../repositories/event.repository";
import { LeadRepository } from "../repositories/lead.repository";
import { MediaRepository } from "../repositories/media.repository";
import { PaymentPlanRepository } from "../repositories/payment-plan.repository";
import { PropertyRepository } from "../repositories/property.repository";
import { VisitRepository } from "../repositories/visit.repository";
import { CompanyInformationService } from "./company-information.service";
import { ConversationService } from "./conversation.service";
import { HumanHandoffService } from "./human-handoff.service";
import { LeadService } from "./lead.service";
import { OwnershipValidator } from "./ownership-validator";
import { PaymentPlanService } from "./payment-plan.service";
import { PropertyAvailabilityService } from "./property-availability.service";
import { PropertyDetailsService } from "./property-details.service";
import { PropertyDocumentsService } from "./property-documents.service";
import { PropertyMediaService } from "./property-media.service";
import { PropertyReferenceService } from "./property-reference.service";
import { PropertySearchService } from "./property-search.service";
import { VisitService } from "./visit.service";

export function createAgentCoreServices() {
  const supabase = getBackendSupabaseClient();

  const propertyRepository = new PropertyRepository(supabase);
  const mediaRepository = new MediaRepository(supabase);
  const documentRepository = new DocumentRepository(supabase);
  const paymentPlanRepository = new PaymentPlanRepository(supabase);
  const companyRepository = new CompanyRepository(supabase);
  const conversationRepository = new ConversationRepository(supabase);
  const leadRepository = new LeadRepository(supabase);
  const visitRepository = new VisitRepository(supabase);
  const eventRepository = new EventRepository(supabase);
  const ownershipValidator = new OwnershipValidator(conversationRepository, propertyRepository);

  return {
    repositories: {
      propertyRepository,
      mediaRepository,
      documentRepository,
      paymentPlanRepository,
      companyRepository,
      conversationRepository,
      leadRepository,
      visitRepository,
      eventRepository
    },
    services: {
      propertySearchService: new PropertySearchService(propertyRepository, mediaRepository),
      propertyReferenceService: new PropertyReferenceService(propertyRepository),
      propertyDetailsService: new PropertyDetailsService(propertyRepository),
      propertyAvailabilityService: new PropertyAvailabilityService(propertyRepository),
      propertyMediaService: new PropertyMediaService(mediaRepository),
      propertyDocumentsService: new PropertyDocumentsService(documentRepository, propertyRepository),
      paymentPlanService: new PaymentPlanService(paymentPlanRepository),
      companyInformationService: new CompanyInformationService(companyRepository),
      conversationService: new ConversationService(conversationRepository, companyRepository),
      leadService: new LeadService(leadRepository, ownershipValidator),
      visitService: new VisitService(visitRepository, ownershipValidator),
      humanHandoffService: new HumanHandoffService(
        conversationRepository,
        leadRepository,
        eventRepository,
        ownershipValidator
      )
    }
  };
}

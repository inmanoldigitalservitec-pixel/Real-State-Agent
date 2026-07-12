import { loadMonorepoEnv } from "../config/load-env";
import { createAgentCoreServices } from "../services";
import { ServiceException } from "../lib/errors/service-error";

const envPath = loadMonorepoEnv(import.meta.url);

function summarize(title: string, payload: unknown) {
  console.log(`\n## ${title}`);
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  summarize("env", { envPath });
  const { services } = createAgentCoreServices();

  const propertySearch = await services.propertySearchService.search({
    location: "Distrito Nacional",
    bedrooms: 3,
    maximumPrice: 8000000,
    currency: "DOP"
  });

  summarize("searchProperties", propertySearch.map((item) => ({
    propertyId: item.propertyId,
    propertyName: item.propertyName,
    developmentName: item.developmentName,
    availableUnits: item.availableUnits,
    priceFrom: item.priceFrom
  })));

  const resolved = await services.propertyReferenceService.resolveReference({
    reference: "Villa Mella",
    sourcePropertyId: "00000000-0000-0000-0000-000000000201"
  });
  summarize("resolvePropertyReference", resolved);

  const details = await services.propertyDetailsService.getPropertyDetails("00000000-0000-0000-0000-000000000201");
  summarize("getPropertyDetails", {
    propertyId: details.propertyId,
    propertyName: details.propertyName,
    availableUnits: details.availableUnits,
    amenities: details.amenities.length
  });

  const availability = await services.propertyAvailabilityService.checkPropertyAvailability(
    "00000000-0000-0000-0000-000000000201"
  );
  summarize("checkPropertyAvailability", availability);

  const media = await services.propertyMediaService.getPropertyMedia({
    propertyId: "00000000-0000-0000-0000-000000000201",
    categories: ["property_gallery", "cover_image"]
  });
  summarize("getPropertyMedia", media.map((item) => ({ id: item.id, category: item.category, url: item.publicUrl })));

  const documents = await services.propertyDocumentsService.getPropertyDocuments({
    propertyId: "00000000-0000-0000-0000-000000000201",
    categories: ["brochure", "floor_plan"]
  });
  summarize("getPropertyDocuments", documents.map((item) => ({ id: item.id, category: item.category, title: item.title })));

  const paymentPlan = await services.paymentPlanService.getPaymentPlan({
    propertyId: "00000000-0000-0000-0000-000000000201"
  });
  summarize("getPaymentPlan", paymentPlan);

  const companyInformation = await services.companyInformationService.getCompanyInformation(
    "00000000-0000-0000-0000-000000000001"
  );
  summarize("getCompanyInformation", {
    company: companyInformation.name,
    phone: companyInformation.phone,
    faqs: companyInformation.faqs.length
  });

  const conversationContext = await services.conversationService.getConversationContext(
    "00000000-0000-0000-0000-000000001001"
  );
  summarize("getConversationContext", {
    conversationId: conversationContext.conversationId,
    currentSalesStage: conversationContext.currentSalesStage,
    messages: conversationContext.messages.length,
    activePropertyId: conversationContext.memory?.activePropertyId
  });
}

main().catch((error) => {
  if (error instanceof ServiceException) {
    console.error(JSON.stringify(error.toJSON(), null, 2));
    process.exitCode = 1;
    return;
  }

  console.error(error);
  process.exitCode = 1;
});

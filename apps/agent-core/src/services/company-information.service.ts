import { companyInformationResultSchema, type CompanyInformationResult } from "@real-estate-agent/shared";
import type { CompanyRepository } from "../repositories/company.repository";

export class CompanyInformationService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async getCompanyInformation(companyId: string): Promise<CompanyInformationResult> {
    const [company, faqs] = await Promise.all([
      this.companyRepository.findCompanyById(companyId),
      this.companyRepository.findFaqs(companyId)
    ]);

    return companyInformationResultSchema.parse({
      companyId: company.id,
      slug: company.slug,
      name: company.name,
      brandName: company.brand_name,
      description: company.description,
      phone: company.phone,
      email: company.email,
      websiteUrl: company.website_url,
      whatsappNumber: company.whatsapp_number,
      city: company.city,
      stateRegion: company.state_region,
      timezone: company.timezone,
      faqs: faqs.map((faq) => ({
        id: faq.id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        lastVerifiedAt: faq.last_verified_at
      }))
    });
  }
}

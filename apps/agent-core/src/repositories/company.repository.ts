import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabase, unwrapSupabaseList } from "../lib/supabase-utils";

export type CompanyRecord = TableRow<"companies">;
export type CompanyFaqRecord = TableRow<"company_faqs">;

export class CompanyRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findCompanyById(companyId: string): Promise<CompanyRecord> {
    return unwrapSupabase(
      await this.supabase.from("companies").select("*").eq("id", companyId).single(),
      `Company ${companyId} not found`
    );
  }

  async findFaqs(companyId: string): Promise<CompanyFaqRecord[]> {
    return unwrapSupabaseList(
      await this.supabase
        .from("company_faqs")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      `Unable to load FAQs for company ${companyId}`
    );
  }
}

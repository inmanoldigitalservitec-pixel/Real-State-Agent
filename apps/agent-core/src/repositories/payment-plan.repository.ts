import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableRow } from "../infrastructure/supabase/types";
import { unwrapSupabaseList } from "../lib/supabase-utils";

export type PaymentPlanRecord = TableRow<"payment_plans">;
export type PaymentPlanItemRecord = TableRow<"payment_plan_items">;

export class PaymentPlanRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findPlansByScope(params: {
    propertyId?: string;
    developmentId?: string;
    unitId?: string;
  }): Promise<PaymentPlanRecord[]> {
    let query = this.supabase
      .from("payment_plans")
      .select("*")
      .order("last_verified_at", { ascending: false });

    if (params.unitId) {
      query = query.eq("property_unit_id", params.unitId);
    } else if (params.propertyId) {
      query = query.eq("property_id", params.propertyId);
    } else if (params.developmentId) {
      query = query.eq("development_id", params.developmentId);
    }

    return unwrapSupabaseList(await query, "Unable to load payment plans");
  }

  async findItems(paymentPlanId: string): Promise<PaymentPlanItemRecord[]> {
    return unwrapSupabaseList(
      await this.supabase
        .from("payment_plan_items")
        .select("*")
        .eq("payment_plan_id", paymentPlanId)
        .order("sort_order", { ascending: true }),
      `Unable to load payment plan items for ${paymentPlanId}`
    );
  }
}

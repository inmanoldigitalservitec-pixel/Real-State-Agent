export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          slug: string;
          name: string;
          legal_name: string | null;
          brand_name: string | null;
          description: string | null;
          phone: string | null;
          email: string | null;
          website_url: string | null;
          whatsapp_number: string | null;
          address_line: string | null;
          city: string | null;
          state_region: string | null;
          country_code: string;
          timezone: string;
          active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]> & Pick<Database["public"]["Tables"]["companies"]["Row"], "slug" | "name">;
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
      };
      developments: {
        Row: {
          id: string;
          company_id: string;
          slug: string;
          code: string | null;
          name: string;
          description: string | null;
          short_description: string | null;
          status: string;
          is_active: boolean;
          location_label: string | null;
          sector: string | null;
          city: string;
          province: string | null;
          country_code: string;
          address_text: string | null;
          latitude: number | null;
          longitude: number | null;
          delivery_date_estimate: string | null;
          delivery_notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["developments"]["Row"]> &
          Pick<Database["public"]["Tables"]["developments"]["Row"], "company_id" | "slug" | "name">;
        Update: Partial<Database["public"]["Tables"]["developments"]["Row"]>;
      };
      properties: {
        Row: {
          id: string;
          company_id: string;
          development_id: string;
          slug: string;
          code: string | null;
          name: string;
          property_type: string;
          bedrooms: number | null;
          bathrooms: number | null;
          parking_spaces: number | null;
          area_from_m2: number | null;
          area_to_m2: number | null;
          price_from: number | null;
          price_to: number | null;
          currency: string;
          summary: string | null;
          description: string | null;
          features: string[];
          is_active: boolean;
          sort_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["properties"]["Row"],
            "company_id" | "development_id" | "slug" | "name" | "property_type"
          >;
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
      };
      property_units: {
        Row: {
          id: string;
          company_id: string;
          development_id: string;
          property_id: string;
          unit_code: string | null;
          unit_number: string;
          floor_label: string | null;
          building_label: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          parking_spaces: number | null;
          interior_area_m2: number | null;
          balcony_area_m2: number | null;
          terrace_area_m2: number | null;
          total_area_m2: number | null;
          list_price: number | null;
          currency: string;
          status: string;
          is_active: boolean;
          available_from: string | null;
          last_verified_at: string | null;
          availability_notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["property_units"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["property_units"]["Row"],
            "company_id" | "development_id" | "property_id" | "unit_number"
          >;
        Update: Partial<Database["public"]["Tables"]["property_units"]["Row"]>;
      };
      property_amenities: {
        Row: {
          id: string;
          company_id: string;
          development_id: string | null;
          property_id: string | null;
          property_unit_id: string | null;
          name: string;
          category: string;
          description: string | null;
          sort_order: number;
          is_highlight: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["property_amenities"]["Row"]> &
          Pick<Database["public"]["Tables"]["property_amenities"]["Row"], "company_id" | "name" | "category">;
        Update: Partial<Database["public"]["Tables"]["property_amenities"]["Row"]>;
      };
      property_media: {
        Row: {
          id: string;
          company_id: string;
          development_id: string | null;
          property_id: string | null;
          property_unit_id: string | null;
          bucket_name: string;
          storage_path: string;
          public_url: string | null;
          asset_type: string;
          category: string;
          mime_type: string | null;
          alt_text: string | null;
          caption: string | null;
          sort_order: number;
          is_primary: boolean;
          is_active: boolean;
          width_px: number | null;
          height_px: number | null;
          duration_seconds: number | null;
          last_verified_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["property_media"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["property_media"]["Row"],
            "company_id" | "bucket_name" | "storage_path" | "asset_type" | "category"
          >;
        Update: Partial<Database["public"]["Tables"]["property_media"]["Row"]>;
      };
      property_documents: {
        Row: {
          id: string;
          company_id: string;
          development_id: string | null;
          property_id: string | null;
          property_unit_id: string | null;
          bucket_name: string;
          storage_path: string;
          public_url: string | null;
          asset_type: string;
          category: string;
          title: string;
          mime_type: string | null;
          language_code: string;
          version_label: string | null;
          sort_order: number;
          is_active: boolean;
          expires_at: string | null;
          last_verified_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["property_documents"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["property_documents"]["Row"],
            "company_id" | "bucket_name" | "storage_path" | "category" | "title"
          >;
        Update: Partial<Database["public"]["Tables"]["property_documents"]["Row"]>;
      };
      property_listings: {
        Row: {
          id: string;
          company_id: string;
          development_id: string | null;
          property_id: string;
          property_unit_id: string | null;
          source_platform: string;
          external_listing_id: string | null;
          slug: string;
          title: string;
          description: string | null;
          listing_url: string | null;
          call_to_action: string | null;
          search_tags: string[];
          status: string;
          is_active: boolean;
          published_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["property_listings"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["property_listings"]["Row"],
            "company_id" | "property_id" | "source_platform" | "slug" | "title"
          >;
        Update: Partial<Database["public"]["Tables"]["property_listings"]["Row"]>;
      };
      company_faqs: {
        Row: {
          id: string;
          company_id: string;
          category: string;
          question: string;
          answer: string;
          sort_order: number;
          is_active: boolean;
          last_verified_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_faqs"]["Row"]> &
          Pick<Database["public"]["Tables"]["company_faqs"]["Row"], "company_id" | "category" | "question" | "answer">;
        Update: Partial<Database["public"]["Tables"]["company_faqs"]["Row"]>;
      };
      payment_plans: {
        Row: {
          id: string;
          company_id: string;
          development_id: string | null;
          property_id: string | null;
          property_unit_id: string | null;
          name: string;
          description: string | null;
          currency: string;
          status: string;
          valid_from: string;
          valid_to: string | null;
          last_verified_at: string;
          separation_amount: number | null;
          total_initial_amount: number | null;
          total_initial_percentage: number | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_plans"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["payment_plans"]["Row"],
            "company_id" | "name" | "valid_from" | "last_verified_at"
          >;
        Update: Partial<Database["public"]["Tables"]["payment_plans"]["Row"]>;
      };
      payment_plan_items: {
        Row: {
          id: string;
          payment_plan_id: string;
          name: string;
          description: string | null;
          due_label: string | null;
          due_type: string;
          due_date: string | null;
          days_from_reservation: number | null;
          percentage: number | null;
          amount: number | null;
          currency: string;
          sort_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_plan_items"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["payment_plan_items"]["Row"],
            "payment_plan_id" | "name" | "due_type"
          >;
        Update: Partial<Database["public"]["Tables"]["payment_plan_items"]["Row"]>;
      };
      conversations: {
        Row: {
          id: string;
          company_id: string;
          channel: string;
          external_session_id: string | null;
          source_listing_id: string | null;
          source_property_id: string | null;
          source_property_unit_id: string | null;
          current_sales_stage: string;
          status: string;
          customer_display_name: string | null;
          preferred_contact_method: string | null;
          started_at: string;
          last_message_at: string;
          closed_at: string | null;
          summary: string | null;
          assigned_agent: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conversations"]["Row"]> &
          Pick<Database["public"]["Tables"]["conversations"]["Row"], "company_id">;
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          company_id: string;
          role: string;
          content: string;
          sales_stage: string | null;
          client_message_id: string | null;
          tool_name: string | null;
          raw_payload: Json | null;
          ui_payload: Json | null;
          asset_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["messages"]["Row"],
            "conversation_id" | "company_id" | "role" | "content"
          >;
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
      };
      conversation_state: {
        Row: {
          id: string;
          conversation_id: string;
          company_id: string;
          customer_name: string | null;
          phone: string | null;
          email: string | null;
          preferred_contact_method: string | null;
          preferred_locations: string[];
          rejected_locations: string[];
          bedrooms: number | null;
          bathrooms: number | null;
          parking_spaces: number | null;
          property_types: string[];
          minimum_area_m2: number | null;
          maximum_budget: number | null;
          currency: string | null;
          important_amenities: string[];
          delivery_preference: string | null;
          purchase_purpose: string | null;
          financing_required: boolean | null;
          purchase_timeline: string | null;
          main_objections: string[];
          lead_temperature: string;
          sales_stage: string;
          active_property_id: string | null;
          active_property_unit_id: string | null;
          interested_property_ids: string[];
          recommended_property_ids: string[];
          viewed_property_ids: string[];
          rejected_property_ids: string[];
          recent_property_ids: string[];
          sent_asset_ids: string[];
          sent_brochure_ids: string[];
          sent_floor_plan_ids: string[];
          sent_payment_plan_ids: string[];
          last_customer_intent: string | null;
          last_agent_question: string | null;
          pending_question: string | null;
          conversation_summary: string | null;
          source_channel: string;
          source_listing_id: string | null;
          source_property_id: string | null;
          visit_requested: boolean;
          preferred_visit_date: string | null;
          preferred_visit_time: string | null;
          handoff_requested: boolean;
          handoff_reason: string | null;
          assigned_agent: string | null;
          memory_version: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conversation_state"]["Row"]> &
          Pick<Database["public"]["Tables"]["conversation_state"]["Row"], "conversation_id" | "company_id">;
        Update: Partial<Database["public"]["Tables"]["conversation_state"]["Row"]>;
      };
      leads: {
        Row: {
          id: string;
          company_id: string;
          conversation_id: string | null;
          source_listing_id: string | null;
          source_property_id: string | null;
          source_property_unit_id: string | null;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          preferred_contact_method: string | null;
          preferred_locations: string[];
          maximum_budget: number | null;
          currency: string | null;
          purchase_purpose: string | null;
          financing_required: boolean | null;
          lead_temperature: string;
          sales_stage: string;
          status: string;
          interest_summary: string | null;
          handed_off_to: string | null;
          handoff_reason: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> &
          Pick<Database["public"]["Tables"]["leads"]["Row"], "company_id">;
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
      };
      visit_requests: {
        Row: {
          id: string;
          company_id: string;
          conversation_id: string | null;
          lead_id: string | null;
          development_id: string | null;
          property_id: string | null;
          property_unit_id: string | null;
          customer_name: string;
          phone: string;
          email: string | null;
          preferred_date: string | null;
          preferred_time_window: string | null;
          status: string;
          notes: string | null;
          handoff_required: boolean;
          assigned_agent: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["visit_requests"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["visit_requests"]["Row"],
            "company_id" | "customer_name" | "phone"
          >;
        Update: Partial<Database["public"]["Tables"]["visit_requests"]["Row"]>;
      };
      agent_events: {
        Row: {
          id: string;
          company_id: string;
          conversation_id: string | null;
          message_id: string | null;
          lead_id: string | null;
          visit_request_id: string | null;
          property_id: string | null;
          property_unit_id: string | null;
          sales_stage: string | null;
          event_type: string;
          event_name: string;
          event_payload: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["agent_events"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["agent_events"]["Row"],
            "company_id" | "event_type" | "event_name"
          >;
        Update: Partial<Database["public"]["Tables"]["agent_events"]["Row"]>;
      };
    };
  };
}

export type TableRow<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

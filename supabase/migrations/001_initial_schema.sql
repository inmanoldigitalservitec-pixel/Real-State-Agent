begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.sales_stage as enum (
  'NEW',
  'INQUIRY',
  'DISCOVERY',
  'RECOMMENDATION',
  'PROPERTY_INTEREST',
  'EVALUATION',
  'HIGH_INTENT',
  'VISIT_REQUESTED',
  'HUMAN_HANDOFF',
  'CLOSED'
);

create type public.development_status as enum (
  'pre_sale',
  'construction',
  'ready',
  'delivered',
  'paused'
);

create type public.property_type as enum (
  'apartment',
  'penthouse',
  'villa',
  'townhouse',
  'studio',
  'commercial',
  'office',
  'land'
);

create type public.unit_status as enum (
  'available',
  'reserved',
  'sold',
  'unavailable',
  'hold'
);

create type public.asset_type as enum (
  'image',
  'document',
  'video',
  'virtual_tour',
  'map'
);

create type public.asset_category as enum (
  'cover_image',
  'property_gallery',
  'exterior_gallery',
  'interior_gallery',
  'amenities_gallery',
  'floor_plan',
  'video',
  'virtual_tour',
  'brochure',
  'payment_plan',
  'price_list',
  'location_map',
  'reservation_requirements'
);

create type public.listing_status as enum (
  'draft',
  'published',
  'paused',
  'archived'
);

create type public.payment_plan_status as enum (
  'draft',
  'active',
  'expired',
  'archived'
);

create type public.message_role as enum (
  'system',
  'assistant',
  'user',
  'tool',
  'human_agent'
);

create type public.conversation_channel as enum (
  'web'
);

create type public.conversation_status as enum (
  'active',
  'handoff_pending',
  'closed',
  'abandoned'
);

create type public.lead_status as enum (
  'new',
  'qualified',
  'contacted',
  'nurturing',
  'handoff_requested',
  'closed_won',
  'closed_lost'
);

create type public.lead_temperature as enum (
  'cold',
  'warm',
  'hot'
);

create type public.visit_request_status as enum (
  'requested',
  'confirmed',
  'completed',
  'cancelled'
);

create type public.handoff_reason as enum (
  'requested_by_customer',
  'discount_request',
  'negotiation',
  'reservation',
  'legal_question',
  'financial_question',
  'complaint',
  'visit_request',
  'high_intent',
  'unknown'
);

create type public.agent_event_type as enum (
  'message_received',
  'message_sent',
  'sales_stage_changed',
  'asset_sent',
  'property_viewed',
  'property_rejected',
  'lead_captured',
  'visit_requested',
  'handoff_requested',
  'note'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  legal_name text,
  brand_name text,
  description text,
  phone text,
  email citext,
  website_url text,
  whatsapp_number text,
  address_line text,
  city text,
  state_region text,
  country_code text not null default 'DO',
  timezone text not null default 'America/Santo_Domingo',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.developments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null,
  code text,
  name text not null,
  description text,
  short_description text,
  status public.development_status not null default 'pre_sale',
  is_active boolean not null default true,
  location_label text,
  sector text,
  city text not null,
  province text,
  country_code text not null default 'DO',
  address_text text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  delivery_date_estimate date,
  delivery_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, slug),
  unique (company_id, code)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  development_id uuid not null references public.developments(id) on delete cascade,
  slug text not null,
  code text,
  name text not null,
  property_type public.property_type not null,
  bedrooms integer,
  bathrooms integer,
  parking_spaces integer,
  area_from_m2 numeric(10, 2),
  area_to_m2 numeric(10, 2),
  price_from numeric(14, 2),
  price_to numeric(14, 2),
  currency text not null default 'DOP',
  summary text,
  description text,
  features text[] not null default '{}'::text[],
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (development_id, slug),
  unique (development_id, code),
  check (bedrooms is null or bedrooms >= 0),
  check (bathrooms is null or bathrooms >= 0),
  check (parking_spaces is null or parking_spaces >= 0),
  check (area_from_m2 is null or area_from_m2 >= 0),
  check (area_to_m2 is null or area_to_m2 >= 0),
  check (price_from is null or price_from >= 0),
  check (price_to is null or price_to >= 0)
);

create table public.property_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  development_id uuid not null references public.developments(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_code text,
  unit_number text not null,
  floor_label text,
  building_label text,
  bedrooms integer,
  bathrooms integer,
  parking_spaces integer,
  interior_area_m2 numeric(10, 2),
  balcony_area_m2 numeric(10, 2),
  terrace_area_m2 numeric(10, 2),
  total_area_m2 numeric(10, 2),
  list_price numeric(14, 2),
  currency text not null default 'DOP',
  status public.unit_status not null default 'available',
  is_active boolean not null default true,
  available_from date,
  last_verified_at timestamptz,
  availability_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (property_id, unit_number),
  unique (development_id, unit_code),
  check (bedrooms is null or bedrooms >= 0),
  check (bathrooms is null or bathrooms >= 0),
  check (parking_spaces is null or parking_spaces >= 0),
  check (interior_area_m2 is null or interior_area_m2 >= 0),
  check (balcony_area_m2 is null or balcony_area_m2 >= 0),
  check (terrace_area_m2 is null or terrace_area_m2 >= 0),
  check (total_area_m2 is null or total_area_m2 >= 0),
  check (list_price is null or list_price >= 0)
);

create table public.property_amenities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  development_id uuid references public.developments(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  property_unit_id uuid references public.property_units(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  sort_order integer not null default 0,
  is_highlight boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (num_nonnulls(development_id, property_id, property_unit_id) = 1)
);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  development_id uuid references public.developments(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  property_unit_id uuid references public.property_units(id) on delete cascade,
  bucket_name text not null,
  storage_path text not null,
  public_url text,
  asset_type public.asset_type not null,
  category public.asset_category not null,
  mime_type text,
  alt_text text,
  caption text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  width_px integer,
  height_px integer,
  duration_seconds integer,
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (num_nonnulls(development_id, property_id, property_unit_id) = 1),
  check (storage_path <> ''),
  check (bucket_name <> ''),
  check (asset_type <> 'document')
);

create table public.property_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  development_id uuid references public.developments(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  property_unit_id uuid references public.property_units(id) on delete cascade,
  bucket_name text not null,
  storage_path text not null,
  public_url text,
  asset_type public.asset_type not null default 'document',
  category public.asset_category not null,
  title text not null,
  mime_type text,
  language_code text not null default 'es',
  version_label text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  expires_at date,
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (num_nonnulls(development_id, property_id, property_unit_id) = 1),
  check (storage_path <> ''),
  check (bucket_name <> ''),
  check (asset_type = 'document')
);

create table public.property_listings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  development_id uuid references public.developments(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  property_unit_id uuid references public.property_units(id) on delete set null,
  source_platform text not null,
  external_listing_id text,
  slug text not null,
  title text not null,
  description text,
  listing_url text,
  call_to_action text,
  search_tags text[] not null default '{}'::text[],
  status public.listing_status not null default 'draft',
  is_active boolean not null default true,
  published_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, slug)
);

create table public.company_faqs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category text not null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  development_id uuid references public.developments(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  property_unit_id uuid references public.property_units(id) on delete cascade,
  name text not null,
  description text,
  currency text not null default 'DOP',
  status public.payment_plan_status not null default 'draft',
  valid_from date not null,
  valid_to date,
  last_verified_at timestamptz not null,
  separation_amount numeric(14, 2),
  total_initial_amount numeric(14, 2),
  total_initial_percentage numeric(5, 2),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (num_nonnulls(development_id, property_id, property_unit_id) = 1),
  check (valid_to is null or valid_to >= valid_from),
  check (separation_amount is null or separation_amount >= 0),
  check (total_initial_amount is null or total_initial_amount >= 0),
  check (total_initial_percentage is null or (total_initial_percentage >= 0 and total_initial_percentage <= 100))
);

create table public.payment_plan_items (
  id uuid primary key default gen_random_uuid(),
  payment_plan_id uuid not null references public.payment_plans(id) on delete cascade,
  name text not null,
  description text,
  due_label text,
  due_type text not null,
  due_date date,
  days_from_reservation integer,
  percentage numeric(5, 2),
  amount numeric(14, 2),
  currency text not null default 'DOP',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    due_type in (
      'reservation',
      'signing',
      'construction_installment',
      'delivery',
      'financing',
      'balloon',
      'other'
    )
  ),
  check (days_from_reservation is null or days_from_reservation >= 0),
  check (percentage is null or (percentage >= 0 and percentage <= 100)),
  check (amount is null or amount >= 0)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel public.conversation_channel not null default 'web',
  external_session_id text,
  source_listing_id uuid references public.property_listings(id) on delete set null,
  source_property_id uuid references public.properties(id) on delete set null,
  source_property_unit_id uuid references public.property_units(id) on delete set null,
  current_sales_stage public.sales_stage not null default 'NEW',
  status public.conversation_status not null default 'active',
  customer_display_name text,
  preferred_contact_method text,
  started_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  summary text,
  assigned_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  sales_stage public.sales_stage,
  client_message_id text,
  tool_name text,
  raw_payload jsonb,
  ui_payload jsonb,
  asset_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.conversation_state (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_name text,
  phone text,
  email citext,
  preferred_contact_method text,
  preferred_locations text[] not null default '{}'::text[],
  rejected_locations text[] not null default '{}'::text[],
  bedrooms integer,
  bathrooms integer,
  parking_spaces integer,
  property_types text[] not null default '{}'::text[],
  minimum_area_m2 numeric(10, 2),
  maximum_budget numeric(14, 2),
  currency text,
  important_amenities text[] not null default '{}'::text[],
  delivery_preference text,
  purchase_purpose text,
  financing_required boolean,
  purchase_timeline text,
  main_objections text[] not null default '{}'::text[],
  lead_temperature public.lead_temperature not null default 'cold',
  sales_stage public.sales_stage not null default 'NEW',
  active_property_id uuid references public.properties(id) on delete set null,
  active_property_unit_id uuid references public.property_units(id) on delete set null,
  interested_property_ids uuid[] not null default '{}'::uuid[],
  recommended_property_ids uuid[] not null default '{}'::uuid[],
  viewed_property_ids uuid[] not null default '{}'::uuid[],
  rejected_property_ids uuid[] not null default '{}'::uuid[],
  recent_property_ids uuid[] not null default '{}'::uuid[],
  sent_asset_ids uuid[] not null default '{}'::uuid[],
  sent_brochure_ids uuid[] not null default '{}'::uuid[],
  sent_floor_plan_ids uuid[] not null default '{}'::uuid[],
  sent_payment_plan_ids uuid[] not null default '{}'::uuid[],
  last_customer_intent text,
  last_agent_question text,
  pending_question text,
  conversation_summary text,
  source_channel public.conversation_channel not null default 'web',
  source_listing_id uuid references public.property_listings(id) on delete set null,
  source_property_id uuid references public.properties(id) on delete set null,
  visit_requested boolean not null default false,
  preferred_visit_date date,
  preferred_visit_time text,
  handoff_requested boolean not null default false,
  handoff_reason public.handoff_reason,
  assigned_agent text,
  memory_version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (bedrooms is null or bedrooms >= 0),
  check (bathrooms is null or bathrooms >= 0),
  check (parking_spaces is null or parking_spaces >= 0),
  check (minimum_area_m2 is null or minimum_area_m2 >= 0),
  check (maximum_budget is null or maximum_budget >= 0),
  check (memory_version >= 1)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  source_listing_id uuid references public.property_listings(id) on delete set null,
  source_property_id uuid references public.properties(id) on delete set null,
  source_property_unit_id uuid references public.property_units(id) on delete set null,
  full_name text,
  phone text,
  email citext,
  preferred_contact_method text,
  preferred_locations text[] not null default '{}'::text[],
  maximum_budget numeric(14, 2),
  currency text,
  purchase_purpose text,
  financing_required boolean,
  lead_temperature public.lead_temperature not null default 'warm',
  sales_stage public.sales_stage not null default 'INQUIRY',
  status public.lead_status not null default 'new',
  interest_summary text,
  handed_off_to text,
  handoff_reason public.handoff_reason,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (maximum_budget is null or maximum_budget >= 0)
);

create table public.visit_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  development_id uuid references public.developments(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  property_unit_id uuid references public.property_units(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email citext,
  preferred_date date,
  preferred_time_window text,
  status public.visit_request_status not null default 'requested',
  notes text,
  handoff_required boolean not null default true,
  assigned_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.agent_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  visit_request_id uuid references public.visit_requests(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  property_unit_id uuid references public.property_units(id) on delete set null,
  sales_stage public.sales_stage,
  event_type public.agent_event_type not null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index companies_active_idx on public.companies (active);

create index developments_company_status_idx
  on public.developments (company_id, status, is_active);
create index developments_city_sector_idx
  on public.developments (city, sector);

create index properties_development_type_idx
  on public.properties (development_id, property_type, bedrooms);
create index properties_price_idx
  on public.properties (price_from, price_to);
create index properties_active_idx
  on public.properties (is_active, sort_order);

create index property_units_property_status_idx
  on public.property_units (property_id, status, is_active);
create index property_units_price_idx
  on public.property_units (development_id, list_price);
create index property_units_verified_idx
  on public.property_units (last_verified_at desc);

create index property_amenities_scope_idx
  on public.property_amenities (development_id, property_id, property_unit_id, sort_order);

create index property_media_scope_idx
  on public.property_media (development_id, property_id, property_unit_id, category, sort_order);
create index property_media_primary_idx
  on public.property_media (is_primary, is_active);

create index property_documents_scope_idx
  on public.property_documents (development_id, property_id, property_unit_id, category, sort_order);
create index property_documents_expiry_idx
  on public.property_documents (expires_at, last_verified_at);

create index property_listings_property_idx
  on public.property_listings (property_id, status, is_active);
create index property_listings_platform_idx
  on public.property_listings (source_platform, published_at desc);
create unique index property_listings_external_listing_uidx
  on public.property_listings (company_id, source_platform, external_listing_id)
  where external_listing_id is not null;

create index company_faqs_company_idx
  on public.company_faqs (company_id, is_active, sort_order);

create index payment_plans_scope_idx
  on public.payment_plans (development_id, property_id, property_unit_id, status);
create index payment_plans_validity_idx
  on public.payment_plans (valid_from, valid_to, last_verified_at desc);

create index payment_plan_items_plan_idx
  on public.payment_plan_items (payment_plan_id, sort_order);

create index conversations_company_status_idx
  on public.conversations (company_id, status, current_sales_stage);
create index conversations_source_idx
  on public.conversations (source_listing_id, source_property_id, source_property_unit_id);
create index conversations_last_message_idx
  on public.conversations (last_message_at desc);
create unique index conversations_external_session_uidx
  on public.conversations (company_id, channel, external_session_id)
  where external_session_id is not null;

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
create index messages_role_idx
  on public.messages (role, created_at);
create unique index messages_client_message_uidx
  on public.messages (conversation_id, client_message_id)
  where client_message_id is not null;

create index conversation_state_company_stage_idx
  on public.conversation_state (company_id, sales_stage);
create index conversation_state_active_property_idx
  on public.conversation_state (active_property_id);
create index conversation_state_preferred_locations_gin
  on public.conversation_state using gin (preferred_locations);
create index conversation_state_recent_properties_gin
  on public.conversation_state using gin (recent_property_ids);
create index conversation_state_objections_gin
  on public.conversation_state using gin (main_objections);

create index leads_company_status_idx
  on public.leads (company_id, status, sales_stage, created_at desc);
create index leads_property_idx
  on public.leads (source_property_id, source_property_unit_id);

create index visit_requests_company_status_idx
  on public.visit_requests (company_id, status, preferred_date);
create index visit_requests_property_idx
  on public.visit_requests (property_id, property_unit_id);

create index agent_events_conversation_idx
  on public.agent_events (conversation_id, created_at);
create index agent_events_type_idx
  on public.agent_events (event_type, created_at);

create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create trigger set_developments_updated_at
before update on public.developments
for each row execute function public.set_updated_at();

create trigger set_properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger set_property_units_updated_at
before update on public.property_units
for each row execute function public.set_updated_at();

create trigger set_property_amenities_updated_at
before update on public.property_amenities
for each row execute function public.set_updated_at();

create trigger set_property_media_updated_at
before update on public.property_media
for each row execute function public.set_updated_at();

create trigger set_property_documents_updated_at
before update on public.property_documents
for each row execute function public.set_updated_at();

create trigger set_property_listings_updated_at
before update on public.property_listings
for each row execute function public.set_updated_at();

create trigger set_company_faqs_updated_at
before update on public.company_faqs
for each row execute function public.set_updated_at();

create trigger set_payment_plans_updated_at
before update on public.payment_plans
for each row execute function public.set_updated_at();

create trigger set_payment_plan_items_updated_at
before update on public.payment_plan_items
for each row execute function public.set_updated_at();

create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_messages_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

create trigger set_conversation_state_updated_at
before update on public.conversation_state
for each row execute function public.set_updated_at();

create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create trigger set_visit_requests_updated_at
before update on public.visit_requests
for each row execute function public.set_updated_at();

commit;

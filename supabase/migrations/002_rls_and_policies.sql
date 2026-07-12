begin;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select auth.role() = 'service_role';
$$;

alter table public.companies enable row level security;
alter table public.developments enable row level security;
alter table public.properties enable row level security;
alter table public.property_units enable row level security;
alter table public.property_amenities enable row level security;
alter table public.property_media enable row level security;
alter table public.property_documents enable row level security;
alter table public.property_listings enable row level security;
alter table public.company_faqs enable row level security;
alter table public.payment_plans enable row level security;
alter table public.payment_plan_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_state enable row level security;
alter table public.leads enable row level security;
alter table public.visit_requests enable row level security;
alter table public.agent_events enable row level security;

create policy companies_service_role_all
on public.companies
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy developments_service_role_all
on public.developments
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy properties_service_role_all
on public.properties
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy property_units_service_role_all
on public.property_units
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy property_amenities_service_role_all
on public.property_amenities
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy property_media_service_role_all
on public.property_media
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy property_documents_service_role_all
on public.property_documents
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy property_listings_service_role_all
on public.property_listings
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy company_faqs_service_role_all
on public.company_faqs
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy payment_plans_service_role_all
on public.payment_plans
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy payment_plan_items_service_role_all
on public.payment_plan_items
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy conversations_service_role_all
on public.conversations
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy messages_service_role_all
on public.messages
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy conversation_state_service_role_all
on public.conversation_state
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy leads_service_role_all
on public.leads
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy visit_requests_service_role_all
on public.visit_requests
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy agent_events_service_role_all
on public.agent_events
for all
using (public.is_service_role())
with check (public.is_service_role());

create policy companies_public_read
on public.companies
for select
using (active = true);

create policy developments_public_read
on public.developments
for select
using (is_active = true);

create policy properties_public_read
on public.properties
for select
using (is_active = true);

create policy property_units_public_read
on public.property_units
for select
using (is_active = true);

create policy property_amenities_public_read
on public.property_amenities
for select
using (true);

create policy property_media_public_read
on public.property_media
for select
using (is_active = true);

create policy property_documents_public_read
on public.property_documents
for select
using (
  is_active = true
  and (expires_at is null or expires_at >= current_date)
);

create policy property_listings_public_read
on public.property_listings
for select
using (
  is_active = true
  and status = 'published'
  and (expires_at is null or expires_at >= timezone('utc', now()))
);

create policy company_faqs_public_read
on public.company_faqs
for select
using (is_active = true);

create policy payment_plans_public_read
on public.payment_plans
for select
using (
  status = 'active'
  and valid_from <= current_date
  and (valid_to is null or valid_to >= current_date)
  and last_verified_at is not null
);

create policy payment_plan_items_public_read
on public.payment_plan_items
for select
using (
  exists (
    select 1
    from public.payment_plans pp
    where pp.id = payment_plan_items.payment_plan_id
      and pp.status = 'active'
      and pp.valid_from <= current_date
      and (pp.valid_to is null or pp.valid_to >= current_date)
      and pp.last_verified_at is not null
  )
);

commit;

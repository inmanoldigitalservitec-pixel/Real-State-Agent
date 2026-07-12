begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'property-images',
    'property-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'property-documents',
    'property-documents',
    true,
    20971520,
    array['application/pdf']
  ),
  (
    'property-videos',
    'property-videos',
    true,
    52428800,
    array['video/mp4', 'video/quicktime']
  ),
  (
    'company-assets',
    'company-assets',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_public_read_property_assets
on storage.objects
for select
using (
  bucket_id in (
    'property-images',
    'property-documents',
    'property-videos',
    'company-assets'
  )
);

create policy storage_service_role_manage_property_assets
on storage.objects
for all
using (
  public.is_service_role()
  and bucket_id in (
    'property-images',
    'property-documents',
    'property-videos',
    'company-assets'
  )
)
with check (
  public.is_service_role()
  and bucket_id in (
    'property-images',
    'property-documents',
    'property-videos',
    'company-assets'
  )
);

commit;

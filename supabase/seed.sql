begin;

delete from public.agent_events;
delete from public.visit_requests;
delete from public.leads;
delete from public.conversation_state;
delete from public.messages;
delete from public.conversations;
delete from public.payment_plan_items;
delete from public.payment_plans;
delete from public.company_faqs;
delete from public.property_listings;
delete from public.property_documents;
delete from public.property_media;
delete from public.property_amenities;
delete from public.property_units;
delete from public.properties;
delete from public.developments;
delete from public.companies;

insert into public.companies (
  id,
  slug,
  name,
  legal_name,
  brand_name,
  description,
  phone,
  email,
  website_url,
  whatsapp_number,
  city,
  state_region,
  country_code,
  timezone
)
values (
  '00000000-0000-0000-0000-000000000001',
  'nova-casa-realty',
  'Nova Casa Realty',
  'Nova Casa Realty SRL',
  'Nova Casa Realty',
  'Inmobiliaria de demostracion para el MVP conversacional.',
  '+1-809-555-0100',
  'ventas@novacasa.do',
  'https://demo.novacasa.do',
  '+1-809-555-0100',
  'Santo Domingo',
  'Distrito Nacional',
  'DO',
  'America/Santo_Domingo'
);

insert into public.developments (
  id,
  company_id,
  slug,
  code,
  name,
  description,
  short_description,
  status,
  location_label,
  sector,
  city,
  province,
  address_text,
  latitude,
  longitude,
  delivery_date_estimate,
  delivery_notes
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'residencial-vista-mella',
    'RVM',
    'Residencial Vista Mella',
    'Proyecto familiar en Villa Mella con amenidades y plan de pago flexible.',
    'Apartamentos funcionales en Villa Mella.',
    'construction',
    'Villa Mella',
    'Villa Mella',
    'Santo Domingo Norte',
    'Santo Domingo',
    'Av. Hermanas Mirabal, Villa Mella',
    18.560230,
    -69.898140,
    '2027-03-15',
    'Entrega estimada para el primer trimestre de 2027.'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'torre-horizonte-kennedy',
    'THK',
    'Torre Horizonte Kennedy',
    'Torre urbana de alto perfil cerca de la Kennedy con opciones de tres habitaciones.',
    'Torre urbana premium en el Distrito.',
    'pre_sale',
    'Distrito Nacional',
    'Kennedy',
    'Santo Domingo',
    'Distrito Nacional',
    'Av. John F. Kennedy, Distrito Nacional',
    18.480910,
    -69.948210,
    '2028-06-30',
    'Entrega proyectada para mediados de 2028.'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'parque-del-este-living',
    'PEL',
    'Parque del Este Living',
    'Proyecto de apartamentos de dos habitaciones cerca del Parque del Este.',
    'Opciones practicas en Santo Domingo Este.',
    'ready',
    'Santo Domingo Este',
    'Ensanche Ozama',
    'Santo Domingo Este',
    'Santo Domingo',
    'C/ Central, Ensanche Ozama',
    18.494810,
    -69.852340,
    '2026-11-01',
    'Proyecto listo para entrega inmediata de algunas unidades.'
  );

insert into public.properties (
  id,
  company_id,
  development_id,
  slug,
  code,
  name,
  property_type,
  bedrooms,
  bathrooms,
  parking_spaces,
  area_from_m2,
  area_to_m2,
  price_from,
  price_to,
  currency,
  summary,
  description,
  features,
  sort_order
)
values
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    'vista-mella-familiar-3h',
    'VM-3H',
    'Apartamento Familiar 3H',
    'apartment',
    3,
    2,
    2,
    92.00,
    98.00,
    6400000.00,
    7050000.00,
    'DOP',
    'Modelo de tres habitaciones ideal para familias.',
    'Unidad con balcon, sala-comedor integrada y dos parqueos.',
    array['balcon', 'dos parqueos', 'area infantil'],
    1
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    'vista-mella-compacto-2h',
    'VM-2H',
    'Apartamento Compacto 2H',
    'apartment',
    2,
    2,
    1,
    74.00,
    79.00,
    4950000.00,
    5450000.00,
    'DOP',
    'Modelo funcional con inicial mas comoda.',
    'Pensado para primera vivienda o inversion de entrada.',
    array['un parqueo', 'balcon', 'cocina abierta'],
    2
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000102',
    'horizonte-kennedy-3h-plus',
    'HK-3H',
    'Apartamento Urbano 3H Plus',
    'apartment',
    3,
    2,
    2,
    108.00,
    118.00,
    7850000.00,
    8600000.00,
    'DOP',
    'Modelo amplio cerca de la Kennedy.',
    'Distribucion abierta, lobby y amenidades ejecutivas.',
    array['lobby', 'gym', 'coworking'],
    1
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000103',
    'parque-este-living-2h',
    'PE-2H',
    'Apartamento Parque Este 2H',
    'apartment',
    2,
    2,
    1,
    76.00,
    82.00,
    5200000.00,
    5900000.00,
    'DOP',
    'Apartamento listo para entrega en Santo Domingo Este.',
    'Unidad practica con acceso rapido a vias principales.',
    array['entrega inmediata', 'balcon', 'area social'],
    1
  );

insert into public.property_units (
  id,
  company_id,
  development_id,
  property_id,
  unit_code,
  unit_number,
  floor_label,
  building_label,
  bedrooms,
  bathrooms,
  parking_spaces,
  interior_area_m2,
  total_area_m2,
  list_price,
  currency,
  status,
  available_from,
  last_verified_at,
  availability_notes
)
values
  ('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','RVM-A-201','201','2','Torre A',3,2,2,92.00,96.00,6850000.00,'DOP','available','2026-08-01',timezone('utc', now()),'Disponible para preventa.'),
  ('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','RVM-A-301','301','3','Torre A',3,2,2,94.00,98.00,6990000.00,'DOP','reserved','2026-08-15',timezone('utc', now()),'Reservada temporalmente.'),
  ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','RVM-B-401','401','4','Torre B',3,2,2,95.00,99.00,7050000.00,'DOP','available','2026-09-01',timezone('utc', now()),'Vista mas despejada.'),
  ('00000000-0000-0000-0000-000000000304','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000202','RVM-C-102','102','1','Torre C',2,2,1,74.00,76.00,4950000.00,'DOP','available','2026-08-01',timezone('utc', now()),'Unidad inicial para primera vivienda.'),
  ('00000000-0000-0000-0000-000000000305','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000202','RVM-C-202','202','2','Torre C',2,2,1,76.00,79.00,5250000.00,'DOP','available','2026-08-10',timezone('utc', now()),'Cerca del area social.'),
  ('00000000-0000-0000-0000-000000000306','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000202','RVM-C-302','302','3','Torre C',2,2,1,77.00,80.00,5450000.00,'DOP','sold','2026-08-20',timezone('utc', now()),'Ya vendida.'),
  ('00000000-0000-0000-0000-000000000307','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000203','THK-1001','1001','10','Torre Unica',3,2,2,108.00,112.00,7850000.00,'DOP','available','2026-10-01',timezone('utc', now()),'Precio de lanzamiento.'),
  ('00000000-0000-0000-0000-000000000308','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000203','THK-1202','1202','12','Torre Unica',3,2,2,112.00,116.00,8250000.00,'DOP','available','2026-10-15',timezone('utc', now()),'Nivel medio con mejor vista.'),
  ('00000000-0000-0000-0000-000000000309','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000203','THK-1501','1501','15','Torre Unica',3,2,2,115.00,118.00,8600000.00,'DOP','hold','2026-11-01',timezone('utc', now()),'Retenida mientras se confirma documentacion.'),
  ('00000000-0000-0000-0000-000000000310','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000204','PEL-A-101','101','1','Bloque A',2,2,1,76.00,78.00,5200000.00,'DOP','available','2026-07-20',timezone('utc', now()),'Entrega inmediata.'),
  ('00000000-0000-0000-0000-000000000311','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000204','PEL-A-201','201','2','Bloque A',2,2,1,78.00,80.00,5550000.00,'DOP','available','2026-07-25',timezone('utc', now()),'Buena ventilacion cruzada.'),
  ('00000000-0000-0000-0000-000000000312','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000204','PEL-B-301','301','3','Bloque B',2,2,1,80.00,82.00,5900000.00,'DOP','unavailable','2026-08-05',timezone('utc', now()),'Temporalmente fuera de mercado.');

insert into public.property_amenities (
  id,
  company_id,
  development_id,
  property_id,
  property_unit_id,
  name,
  category,
  description,
  sort_order,
  is_highlight
)
values
  ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101',null,null,'Area infantil','family','Zona de juegos para ninos.',1,true),
  ('00000000-0000-0000-0000-000000000402','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101',null,null,'Gazebo','social','Espacio para actividades sociales.',2,true),
  ('00000000-0000-0000-0000-000000000403','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102',null,null,'Coworking','work','Espacio de trabajo compartido.',1,true),
  ('00000000-0000-0000-0000-000000000404','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102',null,null,'Gimnasio','wellness','Gimnasio equipado.',2,true),
  ('00000000-0000-0000-0000-000000000405','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103',null,null,'Area social','social','Terraza comun para residentes.',1,true),
  ('00000000-0000-0000-0000-000000000406','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000201',null,'Balcon integrado','layout','Balcon con acceso desde la sala.',1,true),
  ('00000000-0000-0000-0000-000000000407','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000203',null,'Lobby climatizado','building','Lobby con recepcion de doble altura.',1,true),
  ('00000000-0000-0000-0000-000000000408','00000000-0000-0000-0000-000000000001',null,null,'00000000-0000-0000-0000-000000000310','Patio lateral','unit','Unidad con patio lateral privado.',1,false);

insert into public.property_media (
  id,
  company_id,
  development_id,
  property_id,
  property_unit_id,
  bucket_name,
  storage_path,
  public_url,
  asset_type,
  category,
  mime_type,
  alt_text,
  caption,
  sort_order,
  is_primary,
  last_verified_at
)
values
  ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000201',null,'property-images','vista-mella/3h/cover.jpg','https://cdn.demo.novacasa.do/vista-mella/3h/cover.jpg','image','cover_image','image/jpeg','Fachada de Vista Mella 3H','Imagen principal de la unidad 3H.',1,true,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000502','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000201',null,'property-images','vista-mella/3h/gallery-1.jpg','https://cdn.demo.novacasa.do/vista-mella/3h/gallery-1.jpg','image','property_gallery','image/jpeg','Sala del apartamento 3H','Sala-comedor integrada.',2,false,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000503','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000201',null,'property-images','vista-mella/3h/gallery-2.jpg','https://cdn.demo.novacasa.do/vista-mella/3h/gallery-2.jpg','image','interior_gallery','image/jpeg','Habitacion principal 3H','Dormitorio principal.',3,false,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000504','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000202',null,'property-images','vista-mella/2h/cover.jpg','https://cdn.demo.novacasa.do/vista-mella/2h/cover.jpg','image','cover_image','image/jpeg','Vista exterior 2H','Imagen principal del modelo 2H.',1,true,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000505','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000203',null,'property-images','kennedy/3h/cover.jpg','https://cdn.demo.novacasa.do/kennedy/3h/cover.jpg','image','cover_image','image/jpeg','Torre Horizonte Kennedy','Imagen principal del proyecto.',1,true,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000506','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000203',null,'property-images','kennedy/3h/gallery-1.jpg','https://cdn.demo.novacasa.do/kennedy/3h/gallery-1.jpg','image','property_gallery','image/jpeg','Sala del modelo urbano','Sala amplia con vista urbana.',2,false,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000507','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000203',null,'property-videos','kennedy/3h/tour.mp4','https://cdn.demo.novacasa.do/kennedy/3h/tour.mp4','video','video','video/mp4','Recorrido del modelo urbano','Video corto del apartamento.',3,false,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000508','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000204',null,'property-images','parque-este/2h/cover.jpg','https://cdn.demo.novacasa.do/parque-este/2h/cover.jpg','image','cover_image','image/jpeg','Fachada de Parque del Este Living','Proyecto listo para entrega.',1,true,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000509','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000204',null,'property-images','parque-este/2h/gallery-1.jpg','https://cdn.demo.novacasa.do/parque-este/2h/gallery-1.jpg','image','property_gallery','image/jpeg','Cocina del modelo 2H','Cocina abierta.',2,false,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000510','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101',null,null,'company-assets','maps/villa-mella-location.png','https://cdn.demo.novacasa.do/maps/villa-mella-location.png','map','location_map','image/png','Mapa general de Villa Mella','Ubicacion referencial del proyecto.',4,false,timezone('utc', now()));

insert into public.property_documents (
  id,
  company_id,
  development_id,
  property_id,
  property_unit_id,
  bucket_name,
  storage_path,
  public_url,
  category,
  title,
  mime_type,
  language_code,
  version_label,
  sort_order,
  expires_at,
  last_verified_at
)
values
  ('00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101',null,null,'property-documents','vista-mella/brochure.pdf','https://cdn.demo.novacasa.do/vista-mella/brochure.pdf','brochure','Brochure Vista Mella','application/pdf','es','v2026.07',1,'2026-12-31',timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000602','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000201',null,'property-documents','vista-mella/3h/floor-plan.pdf','https://cdn.demo.novacasa.do/vista-mella/3h/floor-plan.pdf','floor_plan','Plano 3H Vista Mella','application/pdf','es','v2026.07',2,'2027-12-31',timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000603','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101',null,null,'property-documents','vista-mella/reservation-requirements.pdf','https://cdn.demo.novacasa.do/vista-mella/reservation-requirements.pdf','reservation_requirements','Requisitos de separacion Vista Mella','application/pdf','es','v2026.07',3,'2026-12-31',timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000604','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102',null,null,'property-documents','kennedy/brochure.pdf','https://cdn.demo.novacasa.do/kennedy/brochure.pdf','brochure','Brochure Horizonte Kennedy','application/pdf','es','v2026.07',1,'2026-12-31',timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000605','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000203',null,'property-documents','kennedy/3h/floor-plan.pdf','https://cdn.demo.novacasa.do/kennedy/3h/floor-plan.pdf','floor_plan','Plano Urbano 3H Plus','application/pdf','es','v2026.07',2,'2027-12-31',timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000606','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000203',null,'property-documents','kennedy/payment-plan.pdf','https://cdn.demo.novacasa.do/kennedy/payment-plan.pdf','payment_plan','Plan de pago Kennedy 3H','application/pdf','es','v2026.07',3,'2026-10-31',timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000607','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103',null,null,'property-documents','parque-este/brochure.pdf','https://cdn.demo.novacasa.do/parque-este/brochure.pdf','brochure','Brochure Parque del Este Living','application/pdf','es','v2026.07',1,'2026-12-31',timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000608','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000204',null,'property-documents','parque-este/2h/price-list.pdf','https://cdn.demo.novacasa.do/parque-este/2h/price-list.pdf','price_list','Lista de precios Parque del Este','application/pdf','es','v2026.07',2,'2026-09-30',timezone('utc', now()));

insert into public.property_listings (
  id,
  company_id,
  development_id,
  property_id,
  property_unit_id,
  source_platform,
  external_listing_id,
  slug,
  title,
  description,
  listing_url,
  call_to_action,
  search_tags,
  status,
  is_active,
  published_at
)
values
  ('00000000-0000-0000-0000-000000000701','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000301','instagram','ig-vm-203','apartamento-villa-mella-3h','Apartamento de 3 habitaciones en Villa Mella','Proyecto familiar con plan de pago y amenidades.','https://demo.novacasa.do/listings/apartamento-villa-mella-3h','Solicitar informacion',array['villa mella','3 habitaciones','familia'],'published',true,timezone('utc', now()) - interval '7 days'),
  ('00000000-0000-0000-0000-000000000702','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000203','00000000-0000-0000-0000-000000000307','facebook','fb-ken-1001','apartamento-kennedy-3h','Torre cerca de la Kennedy con 3 habitaciones','Proyecto urbano en preventa con lobby y coworking.','https://demo.novacasa.do/listings/apartamento-kennedy-3h','Ver detalles',array['kennedy','3 habitaciones','distrito'],'published',true,timezone('utc', now()) - interval '5 days'),
  ('00000000-0000-0000-0000-000000000703','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000204','00000000-0000-0000-0000-000000000310','portal','portal-pel-101','parque-este-2h-entrega-inmediata','Apartamento de 2 habitaciones con entrega inmediata','Opcion practica cerca del Parque del Este.','https://demo.novacasa.do/listings/parque-este-2h-entrega-inmediata','Agendar visita',array['santo domingo este','2 habitaciones','entrega inmediata'],'published',true,timezone('utc', now()) - interval '3 days'),
  ('00000000-0000-0000-0000-000000000704','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000304','website','web-vm-102','vista-mella-2h-accesible','Apartamento 2 habitaciones con inicial accesible','Ideal para primera vivienda o inversion de entrada.','https://demo.novacasa.do/listings/vista-mella-2h-accesible','Recibir asesoramiento',array['villa mella','2 habitaciones','inicial comoda'],'published',true,timezone('utc', now()) - interval '2 days');

insert into public.company_faqs (
  id,
  company_id,
  category,
  question,
  answer,
  sort_order,
  is_active,
  last_verified_at
)
values
  ('00000000-0000-0000-0000-000000000801','00000000-0000-0000-0000-000000000001','general','¿Trabajan con financiamiento?','Si. Podemos orientarte sobre las opciones generales del proyecto y un asesor valida los detalles segun el caso.',1,true,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000802','00000000-0000-0000-0000-000000000001','visitas','¿Como puedo coordinar una visita?','Puedes solicitarla por el chat y un asesor confirma el dia y horario segun disponibilidad.',2,true,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000803','00000000-0000-0000-0000-000000000001','pagos','¿Puedo separar con transferencia?','La forma de separacion depende del proyecto y debe confirmarse con un asesor antes de prometer condiciones.',3,true,timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000804','00000000-0000-0000-0000-000000000001','documentos','¿Que documentos necesito para iniciar?','Los requisitos pueden variar por proyecto. Cuando exista interes real, el asesor comparte la lista vigente.',4,true,timezone('utc', now()));

insert into public.payment_plans (
  id,
  company_id,
  development_id,
  property_id,
  property_unit_id,
  name,
  description,
  currency,
  status,
  valid_from,
  valid_to,
  last_verified_at,
  separation_amount,
  total_initial_amount,
  total_initial_percentage,
  notes
)
values
  ('00000000-0000-0000-0000-000000000901','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000201',null,'Plan preventa Vista Mella 3H','Plan de pago vigente para el modelo 3H de Vista Mella.','DOP','active','2026-07-01','2026-12-31',timezone('utc', now()),150000.00,1712500.00,25.00,'Inicial en cuotas durante construccion.'),
  ('00000000-0000-0000-0000-000000000902','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000202',null,'Plan flexible Vista Mella 2H','Plan pensado para una inicial mas comoda.','DOP','active','2026-07-01','2026-12-31',timezone('utc', now()),100000.00,1237500.00,25.00,'Separacion baja y cuotas progresivas.'),
  ('00000000-0000-0000-0000-000000000903','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000203',null,'Lanzamiento Kennedy 3H','Plan de preventa de la torre en Kennedy.','DOP','active','2026-07-01','2026-10-31',timezone('utc', now()),250000.00,1962500.00,25.00,'Condiciones de lanzamiento sujetas a vigencia.'),
  ('00000000-0000-0000-0000-000000000904','00000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000204',null,'Plan expirado Parque del Este 2H','Plan anterior para referencia historica.','DOP','expired','2026-01-01','2026-06-30',timezone('utc', now()) - interval '40 days',120000.00,1300000.00,24.00,'No debe mostrarse al cliente porque ya expiro.');

insert into public.payment_plan_items (
  id,
  payment_plan_id,
  name,
  description,
  due_label,
  due_type,
  days_from_reservation,
  percentage,
  amount,
  currency,
  sort_order
)
values
  ('00000000-0000-0000-0000-000000000911','00000000-0000-0000-0000-000000000901','Separacion','Pago para reservar la unidad.','Hoy','reservation',0,null,150000.00,'DOP',1),
  ('00000000-0000-0000-0000-000000000912','00000000-0000-0000-0000-000000000901','Inicial en construccion','Distribuida en cuotas durante obra.','Durante construccion','construction_installment',30,22.80,1562500.00,'DOP',2),
  ('00000000-0000-0000-0000-000000000913','00000000-0000-0000-0000-000000000901','Contra entrega o financiamiento','Saldo restante al cierre.','Contra entrega','delivery',null,75.00,5137500.00,'DOP',3),
  ('00000000-0000-0000-0000-000000000914','00000000-0000-0000-0000-000000000902','Separacion','Reserva inicial de la unidad.','Hoy','reservation',0,null,100000.00,'DOP',1),
  ('00000000-0000-0000-0000-000000000915','00000000-0000-0000-0000-000000000902','Inicial fraccionada','Cuotas mensuales durante construccion.','Durante construccion','construction_installment',30,23.16,1137500.00,'DOP',2),
  ('00000000-0000-0000-0000-000000000916','00000000-0000-0000-0000-000000000902','Saldo final','Monto restante al cierre.','Contra entrega','delivery',null,75.00,3712500.00,'DOP',3),
  ('00000000-0000-0000-0000-000000000917','00000000-0000-0000-0000-000000000903','Separacion','Reserva de lanzamiento.','Hoy','reservation',0,null,250000.00,'DOP',1),
  ('00000000-0000-0000-0000-000000000918','00000000-0000-0000-0000-000000000903','Inicial en cuotas','Inicial distribuida por vigencia de lanzamiento.','Durante construccion','construction_installment',30,21.82,1712500.00,'DOP',2),
  ('00000000-0000-0000-0000-000000000919','00000000-0000-0000-0000-000000000903','Saldo al cierre','Financiamiento o pago contra entrega.','Contra entrega','delivery',null,75.00,5887500.00,'DOP',3);

insert into public.conversations (
  id,
  company_id,
  channel,
  external_session_id,
  source_listing_id,
  source_property_id,
  source_property_unit_id,
  current_sales_stage,
  status,
  customer_display_name,
  preferred_contact_method,
  started_at,
  last_message_at,
  summary,
  assigned_agent
)
values (
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000001',
  'web',
  'demo-session-001',
  '00000000-0000-0000-0000-000000000701',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  'HIGH_INTENT',
  'handoff_pending',
  'Laura Perez',
  'whatsapp',
  timezone('utc', now()) - interval '2 hours',
  timezone('utc', now()) - interval '10 minutes',
  'Cliente interesada en Vista Mella 3H, presupuesto cercano a siete millones, pidio fotos, plan de pago y solicito visita.',
  'Asesor Demo'
);

insert into public.messages (
  id,
  conversation_id,
  company_id,
  role,
  content,
  sales_stage,
  client_message_id,
  asset_ids,
  created_at
)
values
  ('00000000-0000-0000-0000-000000001101','00000000-0000-0000-0000-000000001001','00000000-0000-0000-0000-000000000001','user','Buenas tardes, me interesa el apartamento de Villa Mella que publicaron.','INQUIRY','msg-001','{}',timezone('utc', now()) - interval '115 minutes'),
  ('00000000-0000-0000-0000-000000001102','00000000-0000-0000-0000-000000001001','00000000-0000-0000-0000-000000000001','assistant','Buenas tardes. Claro, con gusto te ayudo con ese apartamento de Villa Mella. Si quieres, puedo confirmarte disponibilidad, precio o enviarte fotos.','PROPERTY_INTEREST','msg-002','{"00000000-0000-0000-0000-000000000501"}',timezone('utc', now()) - interval '112 minutes'),
  ('00000000-0000-0000-0000-000000001103','00000000-0000-0000-0000-000000001001','00000000-0000-0000-0000-000000000001','user','Mandame fotos y dime cuanto hay que dar de inicial.','EVALUATION','msg-003','{}',timezone('utc', now()) - interval '105 minutes'),
  ('00000000-0000-0000-0000-000000001104','00000000-0000-0000-0000-000000001001','00000000-0000-0000-0000-000000000001','assistant','Claro, te comparto algunas fotos y el plan de pago vigente. Si te interesa, despues coordinamos una visita.','EVALUATION','msg-004','{"00000000-0000-0000-0000-000000000502","00000000-0000-0000-0000-000000000503","00000000-0000-0000-0000-000000000601"}',timezone('utc', now()) - interval '102 minutes'),
  ('00000000-0000-0000-0000-000000001105','00000000-0000-0000-0000-000000001001','00000000-0000-0000-0000-000000000001','user','Perfecto, quiero ir a verlo el sabado.','HIGH_INTENT','msg-005','{}',timezone('utc', now()) - interval '15 minutes');

insert into public.conversation_state (
  id,
  conversation_id,
  company_id,
  customer_name,
  phone,
  preferred_contact_method,
  preferred_locations,
  bedrooms,
  maximum_budget,
  currency,
  purchase_purpose,
  financing_required,
  purchase_timeline,
  main_objections,
  lead_temperature,
  sales_stage,
  active_property_id,
  active_property_unit_id,
  interested_property_ids,
  recommended_property_ids,
  viewed_property_ids,
  rejected_property_ids,
  recent_property_ids,
  sent_asset_ids,
  sent_brochure_ids,
  sent_floor_plan_ids,
  sent_payment_plan_ids,
  last_customer_intent,
  last_agent_question,
  pending_question,
  conversation_summary,
  source_channel,
  source_listing_id,
  source_property_id,
  visit_requested,
  preferred_visit_date,
  preferred_visit_time,
  handoff_requested,
  handoff_reason,
  assigned_agent
)
values (
  '00000000-0000-0000-0000-000000001201',
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000001',
  'Laura Perez',
  '+1-809-555-0199',
  'whatsapp',
  array['Villa Mella'],
  3,
  7000000.00,
  'DOP',
  'live',
  true,
  'within_3_months',
  array['initial_payment'],
  'hot',
  'VISIT_REQUESTED',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  array['00000000-0000-0000-0000-000000000201']::uuid[],
  array['00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000202']::uuid[],
  array['00000000-0000-0000-0000-000000000201']::uuid[],
  array[]::uuid[],
  array['00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000202']::uuid[],
  array['00000000-0000-0000-0000-000000000502','00000000-0000-0000-0000-000000000503','00000000-0000-0000-0000-000000000601']::uuid[],
  array['00000000-0000-0000-0000-000000000601']::uuid[],
  array['00000000-0000-0000-0000-000000000602']::uuid[],
  array['00000000-0000-0000-0000-000000000606']::uuid[],
  'visit_request',
  '¿A qué nombre te gustaría registrarla?',
  'Confirmar nombre y horario de visita',
  'Cliente de alta intencion interesada en Vista Mella 3H. Valora plan de pago y desea visitar el proyecto el sabado.',
  'web',
  '00000000-0000-0000-0000-000000000701',
  '00000000-0000-0000-0000-000000000201',
  true,
  current_date + 5,
  '10:00 AM',
  true,
  'visit_request',
  'Asesor Demo'
);

insert into public.leads (
  id,
  company_id,
  conversation_id,
  source_listing_id,
  source_property_id,
  source_property_unit_id,
  full_name,
  phone,
  preferred_contact_method,
  preferred_locations,
  maximum_budget,
  currency,
  purchase_purpose,
  financing_required,
  lead_temperature,
  sales_stage,
  status,
  interest_summary,
  handed_off_to,
  handoff_reason
)
values (
  '00000000-0000-0000-0000-000000001301',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000701',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  'Laura Perez',
  '+1-809-555-0199',
  'whatsapp',
  array['Villa Mella'],
  7000000.00,
  'DOP',
  'live',
  true,
  'hot',
  'HIGH_INTENT',
  'handoff_requested',
  'Lead generado tras interes alto en Vista Mella 3H y solicitud de visita.',
  'Asesor Demo',
  'visit_request'
);

insert into public.visit_requests (
  id,
  company_id,
  conversation_id,
  lead_id,
  development_id,
  property_id,
  property_unit_id,
  customer_name,
  phone,
  preferred_date,
  preferred_time_window,
  status,
  notes,
  handoff_required,
  assigned_agent
)
values (
  '00000000-0000-0000-0000-000000001401',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000001301',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  'Laura Perez',
  '+1-809-555-0199',
  current_date + 5,
  '10:00 AM - 11:00 AM',
  'requested',
  'Coordinar visita sabado en la manana.',
  true,
  'Asesor Demo'
);

insert into public.agent_events (
  id,
  company_id,
  conversation_id,
  message_id,
  lead_id,
  visit_request_id,
  property_id,
  property_unit_id,
  sales_stage,
  event_type,
  event_name,
  event_payload
)
values
  (
    '00000000-0000-0000-0000-000000001501',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000001001',
    '00000000-0000-0000-0000-000000001102',
    null,
    null,
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000301',
    'PROPERTY_INTEREST',
    'asset_sent',
    'cover_image_sent',
    '{"asset_id":"00000000-0000-0000-0000-000000000501","category":"cover_image"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000001502',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000001001',
    '00000000-0000-0000-0000-000000001104',
    null,
    null,
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000301',
    'EVALUATION',
    'asset_sent',
    'gallery_and_plan_sent',
    '{"asset_ids":["00000000-0000-0000-0000-000000000502","00000000-0000-0000-0000-000000000503","00000000-0000-0000-0000-000000000606"]}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000001503',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000001001',
    '00000000-0000-0000-0000-000000001105',
    '00000000-0000-0000-0000-000000001301',
    '00000000-0000-0000-0000-000000001401',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000301',
    'VISIT_REQUESTED',
    'visit_requested',
    'visit_request_created',
    '{"preferred_date":"scheduled","channel":"web"}'::jsonb
  );

commit;

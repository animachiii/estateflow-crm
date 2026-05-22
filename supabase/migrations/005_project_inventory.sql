-- Project/society catalog for builder-centric inventory.

create extension if not exists pg_trgm;

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  builder_name text,
  city text not null default 'Bengaluru',
  locality text not null,
  micro_market text,
  address text,
  property_types text[] default '{}',
  bedroom_options integer[] default '{}',
  indicative_price_min bigint,
  indicative_price_max bigint,
  builder_contact_name text,
  builder_contact_phone text,
  floor_plan_urls text[] default '{}',
  rera_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table properties
  add column if not exists project_id uuid references projects(id) on delete set null;

create unique index if not exists idx_projects_catalog_slug
  on projects(slug)
  where organization_id is null;

create unique index if not exists idx_projects_org_slug
  on projects(organization_id, slug)
  where organization_id is not null;

create index if not exists idx_projects_org on projects(organization_id);
create index if not exists idx_projects_locality on projects(locality);
create index if not exists idx_projects_builder on projects(builder_name);
create index if not exists idx_projects_name_search on projects using gin (name gin_trgm_ops);
create index if not exists idx_projects_locality_search on projects using gin (locality gin_trgm_ops);
create index if not exists idx_properties_project on properties(project_id);
create index if not exists idx_properties_bedrooms on properties(bedrooms);
create index if not exists idx_properties_price on properties(price);
create index if not exists idx_properties_location_search on properties using gin (location gin_trgm_ops);

alter table projects enable row level security;

create policy "projects_select" on projects for select using (
  organization_id is null or organization_id = get_user_org_id()
);
create policy "projects_insert" on projects for insert with check (
  organization_id = get_user_org_id()
);
create policy "projects_update" on projects for update using (
  organization_id = get_user_org_id()
);
create policy "projects_delete" on projects for delete using (
  organization_id = get_user_org_id()
);

create trigger trg_projects_updated
  before update on projects
  for each row execute function update_updated_at();

insert into projects (
  name,
  slug,
  builder_name,
  locality,
  micro_market,
  property_types,
  bedroom_options,
  notes
) values
  ('Prestige Lakeside Habitat', 'prestige-lakeside-habitat', 'Prestige', 'Varthur', 'Whitefield - Varthur', array['apartment', 'villa'], array[1, 2, 3, 4], 'Starter Bengaluru catalog row. Add current price bands, RERA, contacts, and floor plans as verified.'),
  ('Prestige Shantiniketan', 'prestige-shantiniketan', 'Prestige', 'Whitefield', 'Whitefield', array['apartment'], array[2, 3, 4], 'Starter Bengaluru catalog row.'),
  ('Brigade Cornerstone Utopia', 'brigade-cornerstone-utopia', 'Brigade', 'Varthur', 'Whitefield - Varthur', array['apartment'], array[1, 2, 3], 'Starter Bengaluru catalog row.'),
  ('Brigade Metropolis', 'brigade-metropolis', 'Brigade', 'Mahadevapura', 'ORR - Whitefield', array['apartment'], array[2, 3, 4], 'Starter Bengaluru catalog row.'),
  ('Sobha Dream Acres', 'sobha-dream-acres', 'Sobha', 'Panathur', 'ORR - Varthur', array['apartment'], array[1, 2], 'Starter Bengaluru catalog row.'),
  ('Sobha Royal Pavilion', 'sobha-royal-pavilion', 'Sobha', 'Sarjapur Road', 'Sarjapur', array['apartment'], array[2, 3, 4], 'Starter Bengaluru catalog row.'),
  ('Sattva Greenage', 'sattva-greenage', 'Sattva', 'Bommanahalli', 'South Bengaluru', array['apartment'], array[2, 3, 4], 'Starter Bengaluru catalog row.'),
  ('Sattva Senorita', 'sattva-senorita', 'Sattva', 'Sarjapur Road', 'Sarjapur', array['apartment'], array[2, 3], 'Starter Bengaluru catalog row.'),
  ('Godrej Woodscapes', 'godrej-woodscapes', 'Godrej', 'Budigere Cross', 'Old Madras Road', array['apartment'], array[2, 3, 4], 'Starter Bengaluru catalog row.'),
  ('Godrej Air', 'godrej-air-hoodi', 'Godrej', 'Hoodi', 'Whitefield', array['apartment'], array[1, 2, 3], 'Starter Bengaluru catalog row.')
on conflict do nothing;

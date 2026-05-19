-- EstateFlow CRM Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  avatar_url text,
  organization_id uuid references organizations(id) on delete cascade,
  role text not null default 'sales_agent' check (role in ('admin', 'sales_manager', 'sales_agent', 'field_executive', 'social_media_manager')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Leads
create table leads (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  source text not null default 'manual' check (source in ('36_acre', 'magicbricks', 'housing', 'facebook', 'instagram', 'website', 'referral', 'manual', 'other')),
  property_type text check (property_type in ('apartment', 'villa', 'plot', 'commercial', 'rental')),
  budget_min bigint,
  budget_max bigint,
  preferred_location text,
  status text not null default 'new' check (status in ('new', 'contacted', 'interested', 'site_visit_scheduled', 'negotiation', 'won', 'lost', 'not_responding')),
  temperature text not null default 'warm' check (temperature in ('cold', 'warm', 'hot')),
  assigned_agent_id uuid references profiles(id) on delete set null,
  notes text,
  next_follow_up timestamptz,
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Properties
create table properties (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  location text not null,
  address text,
  property_type text not null check (property_type in ('apartment', 'villa', 'plot', 'commercial', 'rental')),
  price bigint not null,
  size_sqft integer,
  bedrooms integer,
  bathrooms integer,
  floor integer,
  furnishing text check (furnishing in ('unfurnished', 'semi_furnished', 'fully_furnished')),
  availability text not null default 'available' check (availability in ('available', 'hold', 'sold', 'rented')),
  description text,
  amenities text[] default '{}',
  owner_name text,
  owner_phone text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Property Images
create table property_images (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  caption text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Property Documents
create table property_documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  url text not null,
  file_type text not null,
  created_at timestamptz default now()
);

-- Call Logs
create table calls (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  agent_id uuid not null references profiles(id) on delete cascade,
  call_sid text,
  conference_sid text,
  status text not null default 'initiated',
  duration integer,
  recording_url text,
  outcome text check (outcome in ('connected', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'callback_requested', 'not_interested')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Activities (timeline)
create table activities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('call', 'message', 'note', 'follow_up', 'property_share', 'status_change', 'assignment', 'site_visit')),
  title text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Follow-ups
create table followups (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  agent_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('whatsapp', 'sms', 'email', 'call')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'snoozed', 'cancelled')),
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  template_id uuid,
  message text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Follow-up Templates
create table followup_templates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('whatsapp', 'sms', 'email', 'call')),
  message text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Lead Property Shares
create table lead_property_shares (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  shared_by uuid not null references profiles(id) on delete cascade,
  share_link text,
  channel text not null check (channel in ('whatsapp', 'sms', 'email', 'link')),
  created_at timestamptz default now()
);

-- Attendance
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  check_in_time timestamptz not null,
  check_out_time timestamptz,
  check_in_latitude double precision,
  check_in_longitude double precision,
  check_out_latitude double precision,
  check_out_longitude double precision,
  status text not null default 'present' check (status in ('present', 'late', 'absent', 'half_day', 'on_leave')),
  selfie_url text,
  notes text,
  created_at timestamptz default now()
);

-- Social Media Posts
create table social_posts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  post_type text not null check (post_type in ('instagram_reel', 'instagram_post', 'facebook_post', 'linkedin_post', 'story')),
  caption text not null default '',
  media_urls text[] default '{}',
  status text not null default 'idea' check (status in ('idea', 'draft', 'scheduled', 'published')),
  scheduled_at timestamptz,
  published_at timestamptz,
  assigned_to uuid references profiles(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  read boolean default false,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Integration Settings
create table integration_settings (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid unique not null references organizations(id) on delete cascade,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  whatsapp_sender_number text,
  resend_api_key text,
  smtp_host text,
  smtp_port integer,
  smtp_user text,
  smtp_pass text,
  openai_api_key text,
  webhook_secret text,
  lead_assignment_mode text not null default 'round_robin' check (lead_assignment_mode in ('round_robin', 'manual', 'least_busy')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  assigned_to uuid references profiles(id) on delete set null,
  lead_id uuid references leads(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_leads_org on leads(organization_id);
create index idx_leads_agent on leads(assigned_agent_id);
create index idx_leads_status on leads(status);
create index idx_leads_source on leads(source);
create index idx_leads_temperature on leads(temperature);
create index idx_leads_created on leads(created_at desc);
create index idx_properties_org on properties(organization_id);
create index idx_properties_type on properties(property_type);
create index idx_properties_availability on properties(availability);
create index idx_calls_lead on calls(lead_id);
create index idx_calls_agent on calls(agent_id);
create index idx_activities_lead on activities(lead_id);
create index idx_activities_org on activities(organization_id);
create index idx_followups_agent on followups(agent_id);
create index idx_followups_lead on followups(lead_id);
create index idx_followups_scheduled on followups(scheduled_at);
create index idx_followups_status on followups(status);
create index idx_attendance_user on attendance(user_id);
create index idx_attendance_date on attendance(check_in_time);
create index idx_social_posts_org on social_posts(organization_id);
create index idx_notifications_user on notifications(user_id, read);
create index idx_property_images_prop on property_images(property_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger trg_organizations_updated before update on organizations for each row execute function update_updated_at();
create trigger trg_profiles_updated before update on profiles for each row execute function update_updated_at();
create trigger trg_leads_updated before update on leads for each row execute function update_updated_at();
create trigger trg_properties_updated before update on properties for each row execute function update_updated_at();
create trigger trg_followups_updated before update on followups for each row execute function update_updated_at();
create trigger trg_social_posts_updated before update on social_posts for each row execute function update_updated_at();
create trigger trg_integration_settings_updated before update on integration_settings for each row execute function update_updated_at();
create trigger trg_tasks_updated before update on tasks for each row execute function update_updated_at();

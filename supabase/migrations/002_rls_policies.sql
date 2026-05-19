-- Row Level Security Policies

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table property_documents enable row level security;
alter table calls enable row level security;
alter table activities enable row level security;
alter table followups enable row level security;
alter table followup_templates enable row level security;
alter table lead_property_shares enable row level security;
alter table attendance enable row level security;
alter table social_posts enable row level security;
alter table notifications enable row level security;
alter table integration_settings enable row level security;
alter table tasks enable row level security;

-- Helper: get user's org
create or replace function get_user_org_id()
returns uuid as $$
  select organization_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Organizations: users see their own org
create policy "org_select" on organizations for select using (id = get_user_org_id());

-- Profiles: users see profiles in their org
create policy "profiles_select" on profiles for select using (organization_id = get_user_org_id());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "profiles_insert" on profiles for insert with check (true);

-- Leads: org-scoped
create policy "leads_select" on leads for select using (organization_id = get_user_org_id());
create policy "leads_insert" on leads for insert with check (organization_id = get_user_org_id());
create policy "leads_update" on leads for update using (organization_id = get_user_org_id());
create policy "leads_delete" on leads for delete using (organization_id = get_user_org_id());

-- Properties: org-scoped
create policy "properties_select" on properties for select using (organization_id = get_user_org_id());
create policy "properties_insert" on properties for insert with check (organization_id = get_user_org_id());
create policy "properties_update" on properties for update using (organization_id = get_user_org_id());
create policy "properties_delete" on properties for delete using (organization_id = get_user_org_id());

-- Property images: via property org
create policy "prop_images_select" on property_images for select using (
  exists (select 1 from properties where properties.id = property_images.property_id and properties.organization_id = get_user_org_id())
);
create policy "prop_images_insert" on property_images for insert with check (
  exists (select 1 from properties where properties.id = property_images.property_id and properties.organization_id = get_user_org_id())
);
create policy "prop_images_delete" on property_images for delete using (
  exists (select 1 from properties where properties.id = property_images.property_id and properties.organization_id = get_user_org_id())
);

-- Property documents: via property org
create policy "prop_docs_select" on property_documents for select using (
  exists (select 1 from properties where properties.id = property_documents.property_id and properties.organization_id = get_user_org_id())
);
create policy "prop_docs_insert" on property_documents for insert with check (
  exists (select 1 from properties where properties.id = property_documents.property_id and properties.organization_id = get_user_org_id())
);

-- Calls: org-scoped
create policy "calls_select" on calls for select using (organization_id = get_user_org_id());
create policy "calls_insert" on calls for insert with check (organization_id = get_user_org_id());
create policy "calls_update" on calls for update using (organization_id = get_user_org_id());

-- Activities: org-scoped
create policy "activities_select" on activities for select using (organization_id = get_user_org_id());
create policy "activities_insert" on activities for insert with check (organization_id = get_user_org_id());

-- Follow-ups: org-scoped
create policy "followups_select" on followups for select using (organization_id = get_user_org_id());
create policy "followups_insert" on followups for insert with check (organization_id = get_user_org_id());
create policy "followups_update" on followups for update using (organization_id = get_user_org_id());

-- Templates: org-scoped
create policy "templates_select" on followup_templates for select using (organization_id = get_user_org_id());
create policy "templates_insert" on followup_templates for insert with check (organization_id = get_user_org_id());
create policy "templates_update" on followup_templates for update using (organization_id = get_user_org_id());

-- Lead property shares: via lead org
create policy "shares_select" on lead_property_shares for select using (
  exists (select 1 from leads where leads.id = lead_property_shares.lead_id and leads.organization_id = get_user_org_id())
);
create policy "shares_insert" on lead_property_shares for insert with check (
  exists (select 1 from leads where leads.id = lead_property_shares.lead_id and leads.organization_id = get_user_org_id())
);

-- Attendance: org-scoped
create policy "attendance_select" on attendance for select using (organization_id = get_user_org_id());
create policy "attendance_insert" on attendance for insert with check (organization_id = get_user_org_id());
create policy "attendance_update" on attendance for update using (organization_id = get_user_org_id());

-- Social posts: org-scoped
create policy "social_select" on social_posts for select using (organization_id = get_user_org_id());
create policy "social_insert" on social_posts for insert with check (organization_id = get_user_org_id());
create policy "social_update" on social_posts for update using (organization_id = get_user_org_id());
create policy "social_delete" on social_posts for delete using (organization_id = get_user_org_id());

-- Notifications: user sees own
create policy "notif_select" on notifications for select using (user_id = auth.uid());
create policy "notif_insert" on notifications for insert with check (organization_id = get_user_org_id());
create policy "notif_update" on notifications for update using (user_id = auth.uid());

-- Integration settings: org-scoped, admin only via app layer
create policy "integration_select" on integration_settings for select using (organization_id = get_user_org_id());
create policy "integration_insert" on integration_settings for insert with check (organization_id = get_user_org_id());
create policy "integration_update" on integration_settings for update using (organization_id = get_user_org_id());

-- Tasks: org-scoped
create policy "tasks_select" on tasks for select using (organization_id = get_user_org_id());
create policy "tasks_insert" on tasks for insert with check (organization_id = get_user_org_id());
create policy "tasks_update" on tasks for update using (organization_id = get_user_org_id());

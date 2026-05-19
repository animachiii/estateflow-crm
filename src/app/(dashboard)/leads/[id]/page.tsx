import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LeadDetail } from '@/components/leads/lead-detail';
import { notFound } from 'next/navigation';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  const [
    { data: lead },
    { data: activities },
    { data: followups },
    { data: shares },
    { data: agents },
    { data: properties },
    { data: templates },
  ] = await Promise.all([
    supabase.from('leads')
      .select('*, assigned_agent:profiles!leads_assigned_agent_id_fkey(id, full_name, phone)')
      .eq('id', id)
      .single(),
    supabase.from('activities')
      .select('*, user:profiles(full_name)')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('followups')
      .select('*')
      .eq('lead_id', id)
      .order('scheduled_at', { ascending: false })
      .limit(10),
    supabase.from('lead_property_shares')
      .select('*, property:properties(title, location, price)')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles')
      .select('id, full_name')
      .in('role', ['sales_agent', 'sales_manager', 'admin']),
    supabase.from('properties')
      .select('id, title, location, price, property_type, bedrooms, availability')
      .eq('availability', 'available')
      .limit(20),
    supabase.from('followup_templates')
      .select('*')
      .order('is_default', { ascending: false }),
  ]);

  if (!lead) return notFound();

  // Recommended properties based on lead preferences
  const recommended = properties?.filter(p => {
    if (lead.property_type && p.property_type !== lead.property_type) return false;
    if (lead.budget_max && p.price > lead.budget_max) return false;
    if (lead.budget_min && p.price < lead.budget_min) return false;
    return true;
  }).slice(0, 5) || [];

  return (
    <LeadDetail
      lead={lead}
      activities={activities || []}
      followups={followups || []}
      shares={shares || []}
      agents={agents || []}
      recommendedProperties={recommended}
      templates={templates || []}
    />
  );
}

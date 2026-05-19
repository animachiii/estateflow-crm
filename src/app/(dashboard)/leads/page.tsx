import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LeadsList } from '@/components/leads/leads-list';

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('leads')
    .select('*, assigned_agent:profiles!leads_assigned_agent_id_fkey(full_name)')
    .order('created_at', { ascending: false });

  if (params.status) query = query.eq('status', params.status);
  if (params.source) query = query.eq('source', params.source);
  if (params.temperature) query = query.eq('temperature', params.temperature);
  if (params.agent) query = query.eq('assigned_agent_id', params.agent);
  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,phone.ilike.%${params.q}%,email.ilike.%${params.q}%`);

  const { data: leads } = await query.limit(50);

  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['sales_agent', 'sales_manager', 'admin']);

  return (
    <LeadsList
      leads={leads || []}
      agents={agents || []}
      filters={{
        status: (params.status as string) || '',
        source: (params.source as string) || '',
        temperature: (params.temperature as string) || '',
        agent: (params.agent as string) || '',
        q: (params.q as string) || '',
      }}
    />
  );
}

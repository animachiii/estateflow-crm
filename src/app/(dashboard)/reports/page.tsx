import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ReportsContent } from '@/components/dashboard/reports-content';

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: allLeads } = await supabase.from('leads').select('source, status, temperature, assigned_agent_id');
  const { data: allCalls } = await supabase.from('calls').select('agent_id, duration, outcome');
  const { data: allFollowups } = await supabase.from('followups').select('agent_id, status');
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['sales_agent', 'sales_manager']);

  return (
    <ReportsContent
      leads={allLeads || []}
      calls={allCalls || []}
      followups={allFollowups || []}
      agents={agents || []}
    />
  );
}

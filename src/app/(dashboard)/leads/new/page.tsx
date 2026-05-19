import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LeadForm } from '@/components/leads/lead-form';

export default async function NewLeadPage() {
  const supabase = await createServerSupabaseClient();
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['sales_agent', 'sales_manager', 'admin']);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add New Lead</h1>
      <LeadForm agents={agents || []} />
    </div>
  );
}

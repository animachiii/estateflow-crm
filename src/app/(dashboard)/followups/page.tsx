import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FollowUpsList } from '@/components/followups/followups-list';

export default async function FollowUpsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: followups } = await supabase
    .from('followups')
    .select('*, lead:leads(full_name, phone), agent:profiles!followups_agent_id_fkey(full_name)')
    .in('status', ['pending', 'snoozed'])
    .order('scheduled_at')
    .limit(50);

  return <FollowUpsList followups={followups || []} />;
}

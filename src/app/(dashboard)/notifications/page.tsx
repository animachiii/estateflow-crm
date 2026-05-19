import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NotificationsList } from '@/components/shared/notifications-list';

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Mark all as read
  await supabase.from('notifications').update({ read: true }).eq('read', false);

  return <NotificationsList notifications={notifications || []} />;
}

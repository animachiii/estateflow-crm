import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SocialCalendar } from '@/components/social/social-calendar';

export default async function SocialPage() {
  const supabase = await createServerSupabaseClient();

  const { data: posts } = await supabase
    .from('social_posts')
    .select('*, assignee:profiles!social_posts_assigned_to_fkey(full_name)')
    .order('scheduled_at', { ascending: true, nullsFirst: false });

  return <SocialCalendar posts={posts || []} />;
}

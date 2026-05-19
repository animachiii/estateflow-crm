import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TeamPage as TeamContent } from '@/components/shared/team-page';

export default async function TeamPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('role')
    .order('full_name');

  return <TeamContent members={members || []} currentProfile={profile!} />;
}

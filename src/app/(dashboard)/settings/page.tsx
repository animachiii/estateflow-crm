import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsContent } from '@/components/shared/settings-page';

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: org } = await supabase.from('organizations').select('*').single();
  const { data: settings } = await supabase.from('integration_settings').select('*').single();

  return <SettingsContent profile={profile!} org={org} settings={settings} />;
}

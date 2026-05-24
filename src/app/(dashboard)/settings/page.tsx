import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsContent } from '@/components/shared/settings-page';

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return null;

  const [{ data: org }, { data: settings }] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', profile.organization_id).single(),
    supabase.from('integration_settings').select('*').eq('organization_id', profile.organization_id).maybeSingle(),
  ]);

  return <SettingsContent profile={profile} org={org} settings={settings} />;
}

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsContent } from '@/components/shared/settings-page';
import { getVercelAiConfig } from '@/lib/services/ai-config';

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

  const clientSettings = {
    ...(settings || {}),
    has_ai_api_key: Boolean(settings?.ai_api_key || settings?.openai_api_key),
    has_project_ai_config: Boolean(getVercelAiConfig()),
    ai_api_key: null,
    openai_api_key: null,
  };

  return <SettingsContent profile={profile} org={org} settings={clientSettings} />;
}

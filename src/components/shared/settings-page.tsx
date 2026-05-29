'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { signOut } from '@/app/actions/auth';
import { saveIntegrationSettings, updateProfilePhone } from '@/app/actions/settings';
import { useActionState, useState } from 'react';
import { LogOut, Building2, Plug, User, Database, Trash2, Sparkles, ExternalLink } from 'lucide-react';
import { PROVIDER_LABELS, PROVIDER_KEY_URLS, type AiProvider } from '@/lib/services/ai-service';
import { loadDemoData, clearDemoData } from '@/app/actions/demo-data';
import { useTransition } from 'react';
import type { IntegrationSettings, Organization, Profile } from '@/types';

type ClientIntegrationSettings = Partial<Omit<IntegrationSettings, 'ai_api_key' | 'openai_api_key'>> & {
  ai_api_key: null;
  openai_api_key: null;
  has_ai_api_key: boolean;
  has_project_ai_config: boolean;
};

interface Props {
  profile: Profile;
  org: Organization | null;
  settings: ClientIntegrationSettings;
}

export function SettingsContent({ profile, org, settings }: Props) {
  const integrationSettings = settings;
  const hasAiApiKey = Boolean(integrationSettings.has_ai_api_key);
  const hasProjectAiConfig = Boolean(integrationSettings.has_project_ai_config);
  const [integrationsState, saveIntegrations, savingIntegrations] = useActionState(saveIntegrationSettings, null);
  const [phoneState, savePhone, savingPhone] = useActionState(updateProfilePhone, null);
  const [aiProvider, setAiProvider] = useState<AiProvider>((integrationSettings.ai_provider as AiProvider) || 'gemini');
  const integrationsMessage = integrationsState && 'success' in integrationsState && integrationsState.success
    ? `Settings saved.${'warning' in integrationsState && integrationsState.warning ? ` ${integrationsState.warning}` : ''}`
    : integrationsState && 'error' in integrationsState && integrationsState.error
      ? `Error: ${integrationsState.error}`
      : '';
  const phoneMessage = phoneState && 'success' in phoneState && phoneState.success
    ? 'Phone updated.'
    : phoneState && 'error' in phoneState && phoneState.error
      ? `Error: ${phoneState.error}`
      : '';
  const message = phoneMessage || integrationsMessage;
  const [demoMsg, setDemoMsg] = useState('');
  const [demoBusy, setDemoBusy] = useState<'load' | 'clear' | null>(null);
  const [, startTransition] = useTransition();
  const isAdmin = profile.role === 'admin';
  const canManageDemo = isAdmin || profile.role === 'sales_manager';

  function handleLoadDemo() {
    setDemoMsg('');
    setDemoBusy('load');
    startTransition(async () => {
      const r = await loadDemoData();
      if ('error' in r && r.error) {
        setDemoMsg(`Error: ${r.error}`);
      } else if ('counts' in r && r.counts) {
        setDemoMsg(`Loaded ${r.counts.leads} leads, ${r.counts.properties} properties, ${r.counts.followups} follow-ups.`);
      }
      setDemoBusy(null);
    });
  }

  function handleClearDemo() {
    if (!confirm('Delete ALL leads, properties, follow-ups, calls, and activities in this org? This cannot be undone.')) return;
    setDemoMsg('');
    setDemoBusy('clear');
    startTransition(async () => {
      const r = await clearDemoData();
      setDemoMsg('error' in r && r.error ? `Error: ${r.error}` : 'All data cleared.');
      setDemoBusy(null);
    });
  }


  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {message && (
        <div className={`text-sm px-3 py-2 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}


      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
            <div>
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <p className="text-xs text-gray-400 capitalize">{profile.role.replace('_', ' ')}</p>
            </div>
          </div>
          <form action={savePhone} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Your Phone Number <span className="text-gray-400">(used for bridge calls)</span>
              </label>
              <Input name="phone" type="tel" defaultValue={profile.phone || ''} placeholder="+917014649820" />
            </div>
            <Button type="submit" size="sm" variant="outline" loading={savingPhone} loadingText="Saving...">Update</Button>
          </form>
        </CardContent>
      </Card>

      {/* Organization */}
      {org && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Organization</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{org.name}</p>
            <p className="text-xs text-gray-500">Slug: {org.slug}</p>
          </CardContent>
        </Card>
      )}

      {/* Integrations */}
      {profile.role === 'admin' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Integrations</CardTitle></CardHeader>
          <CardContent>
            <form action={saveIntegrations} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exotel Account SID</label>
                  <Input name="exotel_account_sid" defaultValue={integrationSettings.exotel_account_sid || ''} placeholder="e.g. your_account_sid" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exotel API Key</label>
                  <Input name="exotel_api_key" defaultValue={integrationSettings.exotel_api_key || ''} placeholder="e.g. your_api_key" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exotel API Token</label>
                  <Input name="exotel_api_token" type="password" defaultValue={integrationSettings.exotel_api_token || ''} placeholder="e.g. your_api_token" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exotel Caller ID (ExoPhone)</label>
                  <Input name="exotel_caller_id" defaultValue={integrationSettings.exotel_caller_id || ''} placeholder="e.g. 080xxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exotel Subdomain / Region</label>
                  <Input name="exotel_subdomain" defaultValue={integrationSettings.exotel_subdomain || 'api.in.exotel.com'} placeholder="api.in.exotel.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp Sender (ExoPhone)</label>
                  <Input name="whatsapp_sender_number" defaultValue={integrationSettings.whatsapp_sender_number || ''} placeholder="e.g. +91..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exotel DLT Entity ID</label>
                  <Input name="exotel_dlt_entity_id" defaultValue={integrationSettings.exotel_dlt_entity_id || ''} placeholder="For SMS compliance in India" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exotel DLT Template ID</label>
                  <Input name="exotel_dlt_template_id" defaultValue={integrationSettings.exotel_dlt_template_id || ''} placeholder="For SMS compliance in India" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Resend API Key</label>
                  <Input name="resend_api_key" type="password" defaultValue={integrationSettings.resend_api_key || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reminder From Email</label>
                  <Input name="resend_from_email" defaultValue={integrationSettings.resend_from_email || ''} placeholder="reminders@yourdomain.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Webhook Secret</label>
                  <Input name="webhook_secret" defaultValue={integrationSettings.webhook_secret || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lead Assignment</label>
                  <Select name="lead_assignment_mode" defaultValue={integrationSettings.lead_assignment_mode || 'round_robin'}>
                    <option value="round_robin">Round Robin</option>
                    <option value="manual">Manual</option>
                    <option value="least_busy">Least Busy Agent</option>
                  </Select>
                </div>
              </div>

              {/* AI Assistant sub-section */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Powers Draft, Summarize, and Suggest Next Action. Pick one provider; you only need a single API key.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
                    <Select name="ai_provider" value={aiProvider} onChange={(e) => setAiProvider(e.target.value as AiProvider)}>
                      {(Object.entries(PROVIDER_LABELS) as [AiProvider, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                      <span>API Key</span>
                      <a
                        href={PROVIDER_KEY_URLS[aiProvider]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        Get key <ExternalLink className="h-3 w-3" />
                      </a>
                    </label>
                    <Input
                      name="ai_api_key"
                      type="password"
                      autoComplete="off"
                      placeholder={hasProjectAiConfig ? 'Configured in Vercel' : hasAiApiKey ? 'Saved. Paste a new key to replace it' : 'Paste API key'}
                    />
                    {hasProjectAiConfig && (
                      <p className="mt-1 text-xs text-blue-700">Using AI key from Vercel environment variables</p>
                    )}
                    {hasAiApiKey && (
                      <p className="mt-1 text-xs text-green-700">Org fallback API key saved</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Model (optional — leave blank to use default)
                    </label>
                    <Input
                      name="ai_model"
                      defaultValue={integrationSettings.ai_model || ''}
                      placeholder="e.g. gemini-2.5-flash, llama-3.3-70b-versatile, gpt-4o-mini, claude-haiku-4-5"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" loading={savingIntegrations} loadingText="Saving...">Save Settings</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Demo Data */}
      {canManageDemo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Demo Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              Populate your org with Bengaluru-focused leads, project-linked inventory, follow-ups, and activity history so the new society and locality filters are immediately useful.
            </p>
            {demoMsg && (
              <div className={`text-sm px-3 py-2 rounded-lg ${demoMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {demoMsg}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleLoadDemo} loading={demoBusy === 'load'} loadingText="Loading...">
                <Database className="h-4 w-4" /> Load Bengaluru Demo Data
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={handleClearDemo} loading={demoBusy === 'clear'} loadingText="Clearing...">
                  <Trash2 className="h-4 w-4" /> Clear All Data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <form action={signOut}>
        <Button variant="destructive" className="w-full">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </form>
    </div>
  );
}

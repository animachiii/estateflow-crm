'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { signOut } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { LogOut, Building2, Plug, User } from 'lucide-react';
import type { Profile } from '@/types';

interface Props {
  profile: Profile;
  org: any;
  settings: any;
}

export function SettingsContent({ profile, org, settings }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSaveIntegrations(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const { error } = await supabase
      .from('integration_settings')
      .update({
        twilio_account_sid: data.twilio_account_sid || null,
        twilio_auth_token: data.twilio_auth_token || null,
        twilio_phone_number: data.twilio_phone_number || null,
        whatsapp_sender_number: data.whatsapp_sender_number || null,
        resend_api_key: data.resend_api_key || null,
        openai_api_key: data.openai_api_key || null,
        webhook_secret: data.webhook_secret || null,
        lead_assignment_mode: data.lead_assignment_mode,
      })
      .eq('id', settings?.id);

    setMessage(error ? error.message : 'Settings saved!');
    setSaving(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {message && (
        <div className="bg-blue-50 text-blue-700 text-sm px-3 py-2 rounded-lg">{message}</div>
      )}

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
            <div>
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <p className="text-xs text-gray-400 capitalize">{profile.role.replace('_', ' ')}</p>
            </div>
          </div>
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
      {profile.role === 'admin' && settings && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Integrations</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSaveIntegrations} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Twilio Account SID</label>
                  <Input name="twilio_account_sid" defaultValue={settings.twilio_account_sid || ''} placeholder="AC..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Twilio Auth Token</label>
                  <Input name="twilio_auth_token" type="password" defaultValue={settings.twilio_auth_token || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Twilio Phone Number</label>
                  <Input name="twilio_phone_number" defaultValue={settings.twilio_phone_number || ''} placeholder="+1..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp Sender</label>
                  <Input name="whatsapp_sender_number" defaultValue={settings.whatsapp_sender_number || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Resend API Key</label>
                  <Input name="resend_api_key" type="password" defaultValue={settings.resend_api_key || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">OpenAI API Key</label>
                  <Input name="openai_api_key" type="password" defaultValue={settings.openai_api_key || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Webhook Secret</label>
                  <Input name="webhook_secret" defaultValue={settings.webhook_secret || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lead Assignment</label>
                  <Select name="lead_assignment_mode" defaultValue={settings.lead_assignment_mode}>
                    <option value="round_robin">Round Robin</option>
                    <option value="manual">Manual</option>
                    <option value="least_busy">Least Busy Agent</option>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
            </form>
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

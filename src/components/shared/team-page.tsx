'use client';

import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { deleteTeamMember, inviteTeamMember } from '@/app/actions/auth';
import type { Profile } from '@/types';

type TeamMember = Profile & {
  invite_status?: 'active' | 'create_account';
  invited_at?: string | null;
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_agent: 'Sales Agent',
  field_executive: 'Field Executive',
  social_media_manager: 'Social Media',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  sales_manager: 'bg-blue-100 text-blue-800',
  sales_agent: 'bg-green-100 text-green-800',
  field_executive: 'bg-orange-100 text-orange-800',
  social_media_manager: 'bg-pink-100 text-pink-800',
};

interface Props {
  members: TeamMember[];
  currentProfile: Profile;
}

export function TeamPage({ members, currentProfile }: Props) {
  const [showInvite, setShowInvite] = useState(false);
  const [actionResult, setActionResult] = useState<{ error?: string; success?: boolean; message?: string } | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const canInvite = currentProfile.role === 'admin' || currentProfile.role === 'sales_manager';
  const canDeleteMembers = currentProfile.role === 'admin';

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Team</h1>
        {canInvite && (
          <Button size="sm" onClick={() => {
            setShowInvite(!showInvite);
            if (!showInvite) setActionResult(null);
          }}>
            <UserPlus className="h-4 w-4" /> Invite
          </Button>
        )}
      </div>

      {actionResult?.success && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg">{actionResult.message}</div>
      )}
      {actionResult?.error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{actionResult.error}</div>
      )}

      {showInvite && (
        <Card>
          <CardContent className="p-4">
            <form action={async (formData) => {
              const result = await inviteTeamMember(null, formData);
              setActionResult(result);
              if (result.success) setShowInvite(false);
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input name="full_name" placeholder="Full Name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="phone" type="tel" placeholder="Phone" />
                <Select name="role" required>
                  <option value="sales_agent">Sales Agent</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="field_executive">Field Executive</option>
                  <option value="social_media_manager">Social Media Manager</option>
                </Select>
              </div>
              <SubmitButton size="sm" loadingText="Sending...">Send Invite</SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {members.map(m => (
          <Card key={m.id}>
            <CardContent className="p-4 flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <Avatar name={m.full_name} src={m.avatar_url} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{m.full_name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                {m.id === currentProfile.id && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-600">
                    You
                  </Badge>
                )}
                <Badge className={roleColors[m.role]}>{roleLabels[m.role]}</Badge>
                {m.invite_status === 'create_account' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 ring-amber-200">
                    Create account
                  </Badge>
                )}
                {m.invite_status === 'active' && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 ring-emerald-200">
                    Active
                  </Badge>
                )}
                {!m.is_active && <Badge variant="outline" className="text-red-500">Inactive</Badge>}
                {canDeleteMembers && m.id !== currentProfile.id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    loading={deletingMemberId === m.id}
                    loadingText="Removing..."
                    onClick={() => {
                      if (!confirm(`Remove ${m.full_name} from the team? This will delete their account.`)) return;
                      setDeletingMemberId(m.id);
                      void (async () => {
                        const result = await deleteTeamMember(m.id);
                        setActionResult(result);
                        setDeletingMemberId(null);
                      })();
                    }}
                    aria-label={`Delete ${m.full_name}`}
                    title={`Delete ${m.full_name}`}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

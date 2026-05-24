import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { TeamPage as TeamContent } from '@/components/shared/team-page';
import type { Profile } from '@/types';

type TeamMember = Profile & {
  invite_status?: 'active' | 'create_account';
  invited_at?: string | null;
};

type AuthUserForTeam = {
  id: string;
  invited_at?: string | null;
  last_sign_in_at?: string | null;
};

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

  let membersWithStatus: TeamMember[] = members || [];

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const serviceClient = createServiceRoleClient();
    const { data: authData } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authUsers = (authData.users || []) as AuthUserForTeam[];
    const authUsersById = new Map(authUsers.map((authUser) => [authUser.id, authUser]));

    membersWithStatus = membersWithStatus.map((member) => {
      const authUser = authUsersById.get(member.id);

      return {
        ...member,
        invite_status: authUser?.last_sign_in_at ? 'active' : 'create_account',
        invited_at: authUser?.invited_at || null,
      };
    });
  }

  return <TeamContent members={membersWithStatus} currentProfile={profile!} />;
}

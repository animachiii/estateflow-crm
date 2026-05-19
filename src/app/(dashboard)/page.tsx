import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return null;

  const today = new Date().toISOString().split('T')[0];

  const [
    { count: newLeadsToday },
    { count: callsToday },
    { data: dueFollowUps },
    { data: hotLeads },
    { data: recentActivities },
    { count: availableProperties },
    { data: todayAttendance },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`),
    supabase.from('calls').select('*', { count: 'exact', head: true })
      .gte('started_at', `${today}T00:00:00`),
    supabase.from('followups').select('*, lead:leads(full_name, phone)')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(5),
    supabase.from('leads').select('*')
      .eq('temperature', 'hot')
      .not('status', 'in', '("won","lost")')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('activities').select('*, user:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('properties').select('*', { count: 'exact', head: true })
      .eq('availability', 'available'),
    supabase.from('attendance').select('*, user:profiles(full_name)')
      .gte('check_in_time', `${today}T00:00:00`)
      .is('check_out_time', null),
  ]);

  return (
    <DashboardContent
      stats={{
        newLeadsToday: newLeadsToday || 0,
        callsToday: callsToday || 0,
        dueFollowUps: dueFollowUps?.length || 0,
        hotLeads: hotLeads?.length || 0,
        availableProperties: availableProperties || 0,
        checkedIn: todayAttendance?.length || 0,
      }}
      dueFollowUps={dueFollowUps || []}
      hotLeads={hotLeads || []}
      recentActivities={recentActivities || []}
      checkedInUsers={todayAttendance || []}
      profile={profile}
    />
  );
}

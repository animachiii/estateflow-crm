import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AttendancePage as AttendanceContent } from '@/components/attendance/attendance-page';

export default async function AttendancePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const today = new Date().toISOString().split('T')[0];

  const { data: myAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .gte('check_in_time', `${today}T00:00:00`)
    .order('check_in_time', { ascending: false })
    .limit(1);

  const { data: todayAll } = await supabase
    .from('attendance')
    .select('*, user:profiles(full_name, role)')
    .gte('check_in_time', `${today}T00:00:00`)
    .order('check_in_time');

  const { data: recentHistory } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .order('check_in_time', { ascending: false })
    .limit(14);

  return (
    <AttendanceContent
      profile={profile!}
      todayRecord={myAttendance?.[0] || null}
      todayAll={todayAll || []}
      recentHistory={recentHistory || []}
    />
  );
}

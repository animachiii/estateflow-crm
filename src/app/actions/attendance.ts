'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getAuthProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) throw new Error('Profile not found');
  return { supabase, user, profile };
}

export async function checkIn(latitude: number | null, longitude: number | null) {
  const { supabase, user, profile } = await getAuthProfile();

  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', user.id)
    .gte('check_in_time', `${today}T00:00:00`)
    .lte('check_in_time', `${today}T23:59:59`)
    .is('check_out_time', null)
    .limit(1);

  if (existing?.length) return { error: 'Already checked in today' };

  const now = new Date();
  const hour = now.getHours();
  const status = hour >= 10 ? 'late' : 'present';

  const { error } = await supabase.from('attendance').insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    check_in_time: now.toISOString(),
    check_in_latitude: latitude,
    check_in_longitude: longitude,
    status,
  });

  if (error) return { error: error.message };
  revalidatePath('/attendance');
  return { success: true, status };
}

export async function checkOut(latitude: number | null, longitude: number | null) {
  const { supabase, user } = await getAuthProfile();

  const today = new Date().toISOString().split('T')[0];
  const { data: record } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', user.id)
    .gte('check_in_time', `${today}T00:00:00`)
    .lte('check_in_time', `${today}T23:59:59`)
    .is('check_out_time', null)
    .limit(1)
    .single();

  if (!record) return { error: 'No active check-in found' };

  const { error } = await supabase.from('attendance').update({
    check_out_time: new Date().toISOString(),
    check_out_latitude: latitude,
    check_out_longitude: longitude,
  }).eq('id', record.id);

  if (error) return { error: error.message };
  revalidatePath('/attendance');
  return { success: true };
}

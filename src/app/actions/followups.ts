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

export async function createFollowUp(leadId: string, _prevState: unknown, formData: FormData) {
  const { supabase, user, profile } = await getAuthProfile();

  const type = formData.get('type') as string;
  const scheduledAt = formData.get('scheduled_at') as string;
  const message = formData.get('message') as string;

  if (!type || !scheduledAt) return { error: 'Type and date are required' };

  const { error } = await supabase.from('followups').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    agent_id: user.id,
    type,
    scheduled_at: scheduledAt,
    message: message || null,
  });

  if (error) return { error: error.message };

  await supabase.from('leads').update({ next_follow_up: scheduledAt }).eq('id', leadId);
  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'follow_up',
    title: `Follow-up scheduled (${type})`,
  });

  revalidatePath('/followups');
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function completeFollowUp(followUpId: string) {
  const { supabase } = await getAuthProfile();
  await supabase.from('followups').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', followUpId);
  revalidatePath('/followups');
}

export async function snoozeFollowUp(followUpId: string, newDate: string) {
  const { supabase } = await getAuthProfile();
  await supabase.from('followups').update({ status: 'snoozed', scheduled_at: newDate }).eq('id', followUpId);
  revalidatePath('/followups');
}

export async function sendFollowUpMessage(leadId: string, message: string, channel: 'whatsapp' | 'sms') {
  const { supabase, user, profile } = await getAuthProfile();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return { error: 'Lead not found' };

  const { messageService } = await import('@/lib/services/message-service');
  const filledMessage = messageService.fillTemplate(message, {
    leadName: lead.full_name.split(' ')[0],
    preferredLocation: lead.preferred_location || 'your area',
  });

  const result = await messageService.send({ to: lead.phone, body: filledMessage, channel });

  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'message',
    title: `${channel} message sent`,
    description: filledMessage,
  });

  await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', leadId);

  revalidatePath(`/leads/${leadId}`);
  return { success: true, dryRun: result.dryRun };
}

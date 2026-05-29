'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  fillFollowUpTemplate,
  getLeadTemplateVars,
  getTemplateByKey,
} from '@/lib/services/follow-up-playbook';
import type { FollowUpType } from '@/types';
import { revalidatePath } from 'next/cache';

async function getAuthProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) throw new Error('Profile not found');
  return { supabase, user, profile };
}

function normalizeScheduledAt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
  const parsed = new Date(hasTimezone ? trimmed : `${withSeconds}+05:30`);
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
}

async function syncLeadNextFollowUp(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, leadId: string) {
  const { data: nextFollowUp } = await supabase
    .from('followups')
    .select('scheduled_at')
    .eq('lead_id', leadId)
    .in('status', ['pending', 'snoozed'])
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  await supabase
    .from('leads')
    .update({ next_follow_up: nextFollowUp?.scheduled_at || null })
    .eq('id', leadId);
}

async function createLeadFollowUp(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  params: {
    organizationId: string;
    leadId: string;
    agentId: string;
    type: FollowUpType;
    scheduledAt: string;
    message?: string | null;
  },
) {
  await supabase.from('followups').insert({
    organization_id: params.organizationId,
    lead_id: params.leadId,
    agent_id: params.agentId,
    type: params.type,
    scheduled_at: params.scheduledAt,
    message: params.message || null,
  });
}

export async function createFollowUp(leadId: string, _prevState: unknown, formData: FormData) {
  const { supabase, user, profile } = await getAuthProfile();

  const type = formData.get('type') as FollowUpType;
  const scheduledAt = normalizeScheduledAt((formData.get('scheduled_at') as string) || '');
  const message = formData.get('message') as string;

  if (!type || !scheduledAt) return { error: 'Type and date are required' };
  if (!['whatsapp', 'sms', 'email', 'call'].includes(type)) return { error: 'Invalid follow-up type' };

  const { error } = await supabase.from('followups').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    agent_id: user.id,
    type,
    scheduled_at: scheduledAt,
    message: message || null,
  });

  if (error) return { error: error.message };

  await syncLeadNextFollowUp(supabase, leadId);
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
  const { supabase, user, profile } = await getAuthProfile();
  const { data: followUp } = await supabase
    .from('followups')
    .select('lead_id, type')
    .eq('id', followUpId)
    .single();

  await supabase
    .from('followups')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', followUpId);

  if (followUp?.lead_id) {
    await supabase.from('activities').insert({
      organization_id: profile.organization_id,
      lead_id: followUp.lead_id,
      user_id: user.id,
      type: 'follow_up',
      title: `Follow-up completed (${followUp.type})`,
    });
    await syncLeadNextFollowUp(supabase, followUp.lead_id);
    revalidatePath(`/leads/${followUp.lead_id}`);
  }

  revalidatePath('/followups');
}

export async function snoozeFollowUp(followUpId: string, newDate: string) {
  const { supabase, user, profile } = await getAuthProfile();
  const scheduledAt = normalizeScheduledAt(newDate);
  const { data: followUp } = await supabase
    .from('followups')
    .select('lead_id, type')
    .eq('id', followUpId)
    .single();

  await supabase.from('followups').update({ status: 'snoozed', scheduled_at: scheduledAt }).eq('id', followUpId);

  if (followUp?.lead_id) {
    await supabase.from('activities').insert({
      organization_id: profile.organization_id,
      lead_id: followUp.lead_id,
      user_id: user.id,
      type: 'follow_up',
      title: `Follow-up snoozed (${followUp.type})`,
      description: `Moved to ${new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}`,
    });
    await syncLeadNextFollowUp(supabase, followUp.lead_id);
    revalidatePath(`/leads/${followUp.lead_id}`);
  }

  revalidatePath('/followups');
}

export async function sendFollowUpMessage(leadId: string, message: string, channel: 'whatsapp' | 'sms') {
  const { supabase, user, profile } = await getAuthProfile();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return { error: 'Lead not found' };

  const { messageService } = await import('@/lib/services/message-service');
  const filledMessage = fillFollowUpTemplate(message, getLeadTemplateVars(lead));

  const result = await messageService.send({ to: lead.phone, body: filledMessage, channel, organizationId: profile.organization_id });

  if (!result.success) {
    await supabase.from('activities').insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      user_id: user.id,
      type: 'message',
      title: `${channel} message failed`,
      description: result.error || 'Message provider returned an error',
    });

    revalidatePath(`/leads/${leadId}`);
    return { error: result.error || 'Message failed', dryRun: result.dryRun };
  }

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

export async function logLeadTouch(leadId: string, channel: 'call' | 'whatsapp', outcome: 'done' | 'not_done', note?: string) {
  const { supabase, user, profile } = await getAuthProfile();
  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return { error: 'Lead not found' };

  const now = new Date();
  const leadVars = getLeadTemplateVars(lead);
  const isCall = channel === 'call';
  const completed = outcome === 'done';
  const title = isCall
    ? completed ? 'Call completed' : 'Call not completed'
    : completed ? 'WhatsApp reply logged' : 'WhatsApp follow-up not completed';

  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: isCall ? 'call' : 'message',
    title,
    description: note?.trim() || (completed ? 'Marked done from follow-up workbench' : 'Marked not done from follow-up workbench'),
  });

  const leadPatch: Record<string, string | null> = { last_contacted_at: now.toISOString() };
  if (lead.status === 'new') leadPatch.status = 'contacted';
  await supabase.from('leads').update(leadPatch).eq('id', leadId);

  if (isCall && completed) {
    const template = getTemplateByKey('intro_after_connected_call')!;
    await createLeadFollowUp(supabase, {
      organizationId: profile.organization_id,
      leadId,
      agentId: user.id,
      type: 'whatsapp',
      scheduledAt: now.toISOString(),
      message: fillFollowUpTemplate(template.message, leadVars),
    });
  }

  if (isCall && !completed) {
    const template = getTemplateByKey('intro_after_missed_call')!;
    await createLeadFollowUp(supabase, {
      organizationId: profile.organization_id,
      leadId,
      agentId: user.id,
      type: 'whatsapp',
      scheduledAt: now.toISOString(),
      message: fillFollowUpTemplate(template.message, leadVars),
    });
    await createLeadFollowUp(supabase, {
      organizationId: profile.organization_id,
      leadId,
      agentId: user.id,
      type: 'call',
      scheduledAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      message: 'Retry call after missed-call WhatsApp.',
    });
  }

  if (!isCall && completed) {
    await createLeadFollowUp(supabase, {
      organizationId: profile.organization_id,
      leadId,
      agentId: user.id,
      type: 'call',
      scheduledAt: now.toISOString(),
      message: 'Call to qualify budget, location, and timeline before sharing properties.',
    });
  }

  await syncLeadNextFollowUp(supabase, leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/followups');
  revalidatePath('/leads');
  return { success: true };
}

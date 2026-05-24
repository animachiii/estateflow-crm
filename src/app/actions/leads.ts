'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { leadSchema } from '@/lib/validators/lead';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getAuthProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) throw new Error('Profile not found');
  return { supabase, user, profile };
}

export async function createLead(_prevState: unknown, formData: FormData) {
  const { supabase, user, profile } = await getAuthProfile();

  const raw = Object.fromEntries(formData.entries());
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...parsed.data,
      organization_id: profile.organization_id,
      assigned_agent_id: parsed.data.assigned_agent_id || user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: data.id,
    user_id: user.id,
    type: 'note',
    title: 'Lead created manually',
  });

  revalidatePath('/leads');
  redirect(`/leads/${data.id}`);
}

export async function updateLead(leadId: string, _prevState: unknown, formData: FormData) {
  const { supabase } = await getAuthProfile();

  const raw = Object.fromEntries(formData.entries());
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const { error } = await supabase
    .from('leads')
    .update(parsed.data)
    .eq('id', leadId);

  if (error) return { error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  redirect(`/leads/${leadId}`);
}

export async function updateLeadStatus(leadId: string, status: string) {
  const { supabase, user, profile } = await getAuthProfile();

  await supabase.from('leads').update({ status }).eq('id', leadId);
  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'status_change',
    title: `Status changed to ${status}`,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
}

export async function updateLeadTemperature(leadId: string, temperature: string) {
  const { supabase } = await getAuthProfile();
  await supabase.from('leads').update({ temperature }).eq('id', leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
}

export async function assignLead(leadId: string, agentId: string) {
  const { supabase, user, profile } = await getAuthProfile();

  await supabase.from('leads').update({ assigned_agent_id: agentId }).eq('id', leadId);
  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'assignment',
    title: 'Lead reassigned',
    metadata: { agent_id: agentId },
  });

  await supabase.from('notifications').insert({
    organization_id: profile.organization_id,
    user_id: agentId,
    title: 'New Lead Assigned',
    message: 'A new lead has been assigned to you.',
    type: 'lead_assigned',
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
}

export async function addLeadNote(leadId: string, note: string) {
  const { supabase, user, profile } = await getAuthProfile();

  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'note',
    title: 'Note added',
    description: note,
  });

  revalidatePath(`/leads/${leadId}`);
}

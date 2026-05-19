'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { propertySchema } from '@/lib/validators/property';
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

export async function createProperty(_prevState: unknown, formData: FormData) {
  const { supabase, profile } = await getAuthProfile();

  const raw = Object.fromEntries(formData.entries());
  const amenities = formData.get('amenities')
    ? (formData.get('amenities') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const tags = formData.get('tags')
    ? (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const parsed = propertySchema.safeParse({ ...raw, amenities, tags });
  if (!parsed.success) {
    return { error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({ ...parsed.data, organization_id: profile.organization_id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/properties');
  redirect(`/properties/${data.id}`);
}

export async function updateProperty(propertyId: string, _prevState: unknown, formData: FormData) {
  const { supabase } = await getAuthProfile();

  const raw = Object.fromEntries(formData.entries());
  const amenities = formData.get('amenities')
    ? (formData.get('amenities') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const tags = formData.get('tags')
    ? (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const parsed = propertySchema.safeParse({ ...raw, amenities, tags });
  if (!parsed.success) {
    return { error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const { error } = await supabase.from('properties').update(parsed.data).eq('id', propertyId);
  if (error) return { error: error.message };

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath('/properties');
  return { success: true };
}

export async function deleteProperty(propertyId: string) {
  const { supabase } = await getAuthProfile();
  await supabase.from('properties').delete().eq('id', propertyId);
  revalidatePath('/properties');
  redirect('/properties');
}

export async function shareProperty(leadId: string, propertyId: string, channel: string) {
  const { supabase, user, profile } = await getAuthProfile();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  const { data: property } = await supabase.from('properties').select('*').eq('id', propertyId).single();

  if (!lead || !property) return { error: 'Lead or property not found' };

  const { propertyShareService } = await import('@/lib/services/property-share-service');

  let result;
  if (channel === 'whatsapp') result = await propertyShareService.shareViaWhatsApp(lead, property);
  else if (channel === 'sms') result = await propertyShareService.shareViaSms(lead, property);
  else if (channel === 'email') result = await propertyShareService.shareViaEmail(lead, property);
  else return { error: 'Invalid channel' };

  const shareLink = propertyShareService.generateShareLink(propertyId);

  await supabase.from('lead_property_shares').insert({
    lead_id: leadId,
    property_id: propertyId,
    shared_by: user.id,
    share_link: shareLink,
    channel,
  });

  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'property_share',
    title: `Shared ${property.title} via ${channel}`,
    metadata: { property_id: propertyId, channel },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true, dryRun: (result as any)?.dryRun };
}

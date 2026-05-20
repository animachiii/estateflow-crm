'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Save integration settings for the current user's org. Uses service role to
 * bypass RLS — we still verify the caller is an admin of the org first.
 */
export async function saveIntegrationSettings(_prev: unknown, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return { error: 'Profile not found' };
  if (profile.role !== 'admin') return { error: 'Only admins can update settings' };

  const orgId = profile.organization_id;
  const service = createServiceRoleClient();

  // Clean phone numbers — Twilio needs E.164 with no spaces or punctuation
  const cleanPhone = (v: FormDataEntryValue | null) => {
    const s = (v as string | null)?.trim();
    return s ? s.replace(/[\s\-()]/g, '') : null;
  };

  // Core columns — these always exist (schema migration 001)
  const corePayload: Record<string, unknown> = {
    organization_id: orgId,
    twilio_account_sid: ((formData.get('twilio_account_sid') as string) || '').trim() || null,
    twilio_auth_token: ((formData.get('twilio_auth_token') as string) || '').trim() || null,
    twilio_phone_number: cleanPhone(formData.get('twilio_phone_number')),
    exotel_account_sid: ((formData.get('exotel_account_sid') as string) || '').trim() || null,
    exotel_api_key: ((formData.get('exotel_api_key') as string) || '').trim() || null,
    exotel_api_token: ((formData.get('exotel_api_token') as string) || '').trim() || null,
    exotel_caller_id: cleanPhone(formData.get('exotel_caller_id')),
    exotel_subdomain: ((formData.get('exotel_subdomain') as string) || 'api.in.exotel.com').trim() || null,
    exotel_dlt_entity_id: ((formData.get('exotel_dlt_entity_id') as string) || '').trim() || null,
    exotel_dlt_template_id: ((formData.get('exotel_dlt_template_id') as string) || '').trim() || null,
    whatsapp_sender_number: (formData.get('whatsapp_sender_number') as string) || null,
    resend_api_key: (formData.get('resend_api_key') as string) || null,
    webhook_secret: (formData.get('webhook_secret') as string) || null,
    lead_assignment_mode: (formData.get('lead_assignment_mode') as string) || 'round_robin',
  };

  const { data: saved, error: coreError } = await service
    .from('integration_settings')
    .upsert(corePayload, { onConflict: 'organization_id' })
    .select('id, twilio_account_sid, twilio_phone_number, exotel_account_sid, exotel_caller_id')
    .single();

  console.log('[settings.save] payload:', {
    org: orgId,
    has_twilio_sid: !!corePayload.twilio_account_sid,
    has_exotel_sid: !!corePayload.exotel_account_sid,
  });
  console.log('[settings.save] result:', { saved, error: coreError });

  if (coreError) {
    return { error: `Save failed: ${coreError.message}` };
  }
  if (!saved) {
    return { error: 'Save returned no data — possible RLS or constraint issue' };
  }

  // AI columns — only attempt if any AI field has a value. Silently no-op if
  // migration 003 hasn't been applied yet.
  const aiKey = formData.get('ai_api_key') as string;
  const aiProvider = formData.get('ai_provider') as string;
  const aiModel = formData.get('ai_model') as string;

  if (aiKey || aiProvider || aiModel) {
    const { error: aiError } = await service
      .from('integration_settings')
      .update({
        ai_provider: aiProvider || 'gemini',
        ai_api_key: aiKey || null,
        ai_model: aiModel || null,
      })
      .eq('organization_id', orgId);

    if (aiError && !/ai_provider|ai_api_key|ai_model|does not exist/i.test(aiError.message)) {
      return { error: `AI save failed: ${aiError.message}` };
    }
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateProfilePhone(_prev: unknown, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Normalize: strip spaces, hyphens, parentheses — Twilio needs a clean E.164 number
  const raw = (formData.get('phone') as string)?.trim();
  if (!raw) return { error: 'Phone number is required' };
  const phone = raw.replace(/[\s\-()]/g, '');

  const service = createServiceRoleClient();
  const { error } = await service.from('profiles').update({ phone }).eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

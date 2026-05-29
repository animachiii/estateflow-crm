'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getVercelAiConfig } from '@/lib/services/ai-config';
import { type AiProvider } from '@/lib/services/ai-service';
import { revalidatePath } from 'next/cache';

const AI_PROVIDERS: AiProvider[] = ['gemini', 'groq', 'openai', 'anthropic'];

type SupabaseMutationError = {
  message?: string;
  code?: string;
};

function parseAiProvider(value: FormDataEntryValue | null): AiProvider {
  const provider = ((value as string | null) || 'gemini').trim();
  return AI_PROVIDERS.includes(provider as AiProvider) ? provider as AiProvider : 'gemini';
}

function mentionsMissingColumns(error: SupabaseMutationError | null, columns: string[]) {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return columns.some((column) => message.includes(column.toLowerCase()));
}

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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY is missing in Vercel. Add it in Project Settings -> Environment Variables, then redeploy.' };
  }

  const orgId = profile.organization_id;
  const service = createServiceRoleClient();

  // Clean phone numbers — Twilio needs E.164 with no spaces or punctuation
  const cleanPhone = (v: FormDataEntryValue | null) => {
    const s = (v as string | null)?.trim();
    return s ? s.replace(/[\s\-()]/g, '') : null;
  };

  // Core columns from the initial schema. Keep this separate so optional
  // integration migrations cannot block saving the AI key.
  const corePayload = {
    organization_id: orgId,
    twilio_account_sid: ((formData.get('twilio_account_sid') as string) || '').trim() || null,
    twilio_auth_token: ((formData.get('twilio_auth_token') as string) || '').trim() || null,
    twilio_phone_number: cleanPhone(formData.get('twilio_phone_number')),
    whatsapp_sender_number: (formData.get('whatsapp_sender_number') as string) || null,
    resend_api_key: ((formData.get('resend_api_key') as string) || '').trim() || null,
    webhook_secret: (formData.get('webhook_secret') as string) || null,
    lead_assignment_mode: (formData.get('lead_assignment_mode') as string) || 'round_robin',
  };

  const { data: saved, error: coreError } = await service
    .from('integration_settings')
    .upsert(corePayload, { onConflict: 'organization_id' })
    .select('id')
    .single();

  if (coreError) {
    return { error: `Save failed before AI settings could be saved: ${coreError.message}` };
  }
  if (!saved) {
    return { error: 'Save returned no data. Check SUPABASE_SERVICE_ROLE_KEY in Vercel.' };
  }

  const aiKey = ((formData.get('ai_api_key') as string) || '').trim();
  const aiProvider = parseAiProvider(formData.get('ai_provider'));
  const aiModel = ((formData.get('ai_model') as string) || '').trim();
  const projectAiConfig = getVercelAiConfig();

  const aiPayload: Record<string, unknown> = {
    ai_provider: aiProvider,
    ai_model: aiModel || null,
  };

  if (aiKey) {
    aiPayload.ai_api_key = aiKey;
  }

  const optionalWarnings: string[] = [];

  if (!projectAiConfig || aiKey) {
    const { error: aiError } = await service
      .from('integration_settings')
      .update(aiPayload)
      .eq('organization_id', orgId);

    if (aiError) {
      if (mentionsMissingColumns(aiError, ['ai_provider', 'ai_api_key', 'ai_model'])) {
        if (aiKey) {
          return { error: 'AI settings columns are missing in Supabase. Run supabase/migrations/003_ai_settings.sql, then save again.' };
        }
        optionalWarnings.push('AI DB fallback was skipped because migration 003 is not applied.');
      } else {
        return { error: `AI save failed: ${aiError.message}` };
      }
    }
  }

  const exotelPayload = {
    exotel_account_sid: ((formData.get('exotel_account_sid') as string) || '').trim() || null,
    exotel_api_key: ((formData.get('exotel_api_key') as string) || '').trim() || null,
    exotel_api_token: ((formData.get('exotel_api_token') as string) || '').trim() || null,
    exotel_caller_id: cleanPhone(formData.get('exotel_caller_id')),
    exotel_subdomain: ((formData.get('exotel_subdomain') as string) || 'api.in.exotel.com').trim() || null,
    exotel_dlt_entity_id: ((formData.get('exotel_dlt_entity_id') as string) || '').trim() || null,
    exotel_dlt_template_id: ((formData.get('exotel_dlt_template_id') as string) || '').trim() || null,
  };

  const { error: exotelError } = await service
    .from('integration_settings')
    .update(exotelPayload)
    .eq('organization_id', orgId);

  if (exotelError) {
    if (mentionsMissingColumns(exotelError, Object.keys(exotelPayload))) {
      optionalWarnings.push('Exotel fields were skipped because migration 004 is not applied.');
    } else {
      return { error: `Exotel settings save failed: ${exotelError.message}` };
    }
  }

  const resendFromEmail = ((formData.get('resend_from_email') as string) || '').trim() || null;
  const { error: senderError } = await service
    .from('integration_settings')
    .update({ resend_from_email: resendFromEmail })
    .eq('organization_id', orgId);

  if (senderError) {
    if (mentionsMissingColumns(senderError, ['resend_from_email'])) {
      optionalWarnings.push('Reminder sender email was skipped because migration 006 is not applied.');
    } else {
      return { error: `Reminder sender save failed: ${senderError.message}` };
    }
  }

  revalidatePath('/settings');
  return { success: true, warning: optionalWarnings.join(' ') || undefined };
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

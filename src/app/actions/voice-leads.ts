'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateText, isAiConfigured, type AiConfig, type AiProvider } from '@/lib/services/ai-service';
import { getVercelAiConfig } from '@/lib/services/ai-config';
import { leadSchema } from '@/lib/validators/lead';

type ParsedVoiceLead = {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  property_type?: 'apartment' | 'villa' | 'plot' | 'commercial' | 'rental' | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_location?: string | null;
  temperature?: 'cold' | 'warm' | 'hot' | null;
  notes?: string | null;
};

type IntegrationSettings = {
  ai_provider: AiProvider | null;
  ai_api_key: string | null;
  ai_model: string | null;
  openai_api_key: string | null;
};

type TranscriptionConfig = {
  provider: 'groq' | 'openai';
  apiKey: string;
  model: string;
  endpoint: string;
};

async function getAuthContext() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');
  return { supabase, user, profile };
}

function cleanEnv(value: string | undefined) {
  return value?.trim() || undefined;
}

function getTranscriptionConfig(settings: IntegrationSettings | null): TranscriptionConfig | null {
  const envProvider = cleanEnv(process.env.AI_PROVIDER);
  const groqKey = cleanEnv(process.env.GROQ_API_KEY)
    || (envProvider === 'groq' ? cleanEnv(process.env.AI_API_KEY) : undefined)
    || (settings?.ai_provider === 'groq' ? settings.ai_api_key?.trim() : undefined);

  if (groqKey) {
    return {
      provider: 'groq',
      apiKey: groqKey,
      model: cleanEnv(process.env.GROQ_TRANSCRIPTION_MODEL) || 'whisper-large-v3-turbo',
      endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
    };
  }

  const openAiKey = cleanEnv(process.env.OPENAI_API_KEY)
    || (envProvider === 'openai' ? cleanEnv(process.env.AI_API_KEY) : undefined)
    || (settings?.ai_provider === 'openai' ? settings.ai_api_key?.trim() : undefined)
    || settings?.openai_api_key?.trim();

  if (openAiKey) {
    return {
      provider: 'openai',
      apiKey: openAiKey,
      model: 'whisper-1',
      endpoint: 'https://api.openai.com/v1/audio/transcriptions',
    };
  }

  return null;
}

function getParsingConfig(settings: IntegrationSettings | null): AiConfig | null {
  const vercelConfig = getVercelAiConfig();
  if (vercelConfig) return vercelConfig;

  const config = {
    provider: settings?.ai_provider || (settings?.openai_api_key ? 'openai' : undefined),
    apiKey: settings?.ai_api_key || settings?.openai_api_key || undefined,
    model: settings?.ai_model || undefined,
  };

  return isAiConfigured(config) ? config : null;
}

async function transcribeAudio(audio: File, config: TranscriptionConfig) {
  const body = new FormData();
  body.append('file', audio, audio.name || 'voice-note.webm');
  body.append('model', config.model);
  body.append('response_format', 'json');

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body,
  });

  if (!response.ok) {
    throw new Error(`${config.provider} voice transcription failed: ${await response.text()}`);
  }

  const data = await response.json();
  return String(data.text || '').trim();
}

function parseJsonObject(text: string): ParsedVoiceLead {
  const withoutFence = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(withoutFence) as ParsedVoiceLead;
  } catch {
    const match = withoutFence.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI could not parse lead details from the voice note.');
    return JSON.parse(match[0]) as ParsedVoiceLead;
  }
}

async function parseLeadFromTranscript(transcript: string, config: AiConfig) {
  const text = await generateText(
    config,
    [
      {
        role: 'system',
        content: [
          'You extract Indian real estate CRM leads from broker voice notes.',
          'Return only valid JSON. No markdown.',
          'Use null when a field is missing.',
          'Budget must be numeric INR, e.g. 1 crore -> 10000000, 80 lakh -> 8000000.',
          'property_type must be one of apartment, villa, plot, commercial, rental, or null.',
          'temperature must be cold, warm, or hot. Default to warm unless urgency is clear.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Transcript:\n${transcript}\n\nReturn JSON with these keys: full_name, phone, email, property_type, budget_min, budget_max, preferred_location, temperature, notes.`,
      },
    ],
    { temperature: 0.1, maxTokens: 500 },
  );

  return parseJsonObject(text);
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return digits ? `+${digits}` : '';
}

function cleanNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

export async function createLeadFromVoiceNote(formData: FormData) {
  try {
    const { supabase, user, profile } = await getAuthContext();
    const audio = formData.get('audio');

    if (!(audio instanceof File) || audio.size === 0) {
      return { error: 'Record a voice note first.' };
    }

    if (audio.size > 12 * 1024 * 1024) {
      return { error: 'Voice note is too large. Keep it around 20 seconds.' };
    }

    const { data: settings, error: settingsError } = await supabase
      .from('integration_settings')
      .select('ai_provider, ai_api_key, ai_model, openai_api_key')
      .eq('organization_id', profile.organization_id)
      .maybeSingle<IntegrationSettings>();

    if (settingsError) {
      return { error: `Could not load AI settings: ${settingsError.message}` };
    }

    const transcriptionConfig = getTranscriptionConfig(settings);
    if (!transcriptionConfig) {
      return { error: 'Groq key is required for voice transcription. Add GROQ_API_KEY on Vercel or save Groq in Settings -> AI Assistant.' };
    }

    const parsingConfig = getParsingConfig(settings) || {
      provider: transcriptionConfig.provider === 'groq' ? 'groq' as const : 'openai' as const,
      apiKey: transcriptionConfig.apiKey,
      model: transcriptionConfig.provider === 'groq' ? undefined : 'gpt-4o-mini',
    };

    const transcript = await transcribeAudio(audio, transcriptionConfig);
    if (!transcript) {
      return { error: 'Could not hear anything in the voice note.' };
    }

    const parsed = await parseLeadFromTranscript(transcript, parsingConfig);
    const phone = normalizePhone(parsed.phone);

    if (!phone) {
      return { error: 'I could not find a phone number in the voice note.', transcript };
    }

    const notes = [
      parsed.notes?.trim(),
      `Voice transcript: ${transcript}`,
    ].filter(Boolean).join('\n\n');

    const validation = leadSchema.safeParse({
      full_name: parsed.full_name?.trim() || 'Voice lead',
      phone,
      email: parsed.email?.trim() || '',
      source: 'manual',
      property_type: parsed.property_type || null,
      budget_min: cleanNumber(parsed.budget_min),
      budget_max: cleanNumber(parsed.budget_max),
      preferred_location: parsed.preferred_location?.trim() || null,
      status: 'new',
      temperature: parsed.temperature || 'warm',
      assigned_agent_id: user.id,
      notes,
    });

    if (!validation.success) {
      return {
        error: validation.error.issues.map((issue) => issue.message).join(', '),
        transcript,
      };
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        ...validation.data,
        organization_id: profile.organization_id,
      })
      .select('id')
      .single();

    if (leadError) {
      return { error: leadError.message, transcript };
    }

    await supabase.from('activities').insert({
      organization_id: profile.organization_id,
      lead_id: lead.id,
      user_id: user.id,
      type: 'note',
      title: 'Lead created from voice note',
      description: transcript,
      metadata: { source: 'voice_note' },
    });

    revalidatePath('/leads');
    return { success: true, leadId: lead.id, transcript };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Voice lead failed.' };
  }
}

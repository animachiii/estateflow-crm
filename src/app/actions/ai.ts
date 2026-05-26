'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateText, isAiConfigured, type AiConfig } from '@/lib/services/ai-service';
import { formatCurrency } from '@/lib/utils';

async function getOrgAiConfig(): Promise<{ config?: AiConfig; orgId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile) return { error: 'Profile not found' };

  const { data: settings, error: settingsError } = await supabase
    .from('integration_settings')
    .select('ai_provider, ai_api_key, ai_model, openai_api_key')
    .eq('organization_id', profile.organization_id)
    .single();

  if (settingsError) {
    if (/ai_provider|ai_api_key|ai_model|does not exist/i.test(settingsError.message)) {
      return { error: 'AI settings columns are missing. Run supabase/migrations/003_ai_settings.sql in Supabase, then save your API key again.' };
    }
    return { error: `Could not load AI settings: ${settingsError.message}` };
  }

  if (!settings) {
    return { error: 'AI is not configured. Go to Settings -> AI Assistant to add a provider.' };
  }

  const config = {
    provider: settings.ai_provider || (settings.openai_api_key ? 'openai' : undefined),
    apiKey: settings.ai_api_key || settings.openai_api_key,
    model: settings.ai_model || undefined,
  };

  if (!isAiConfigured(config)) {
    return { error: 'AI is not configured. Go to Settings → AI Assistant to add a provider.' };
  }
  return { config, orgId: profile.organization_id };
}

function formatLeadContext(lead: any) {
  const budget = lead.budget_min || lead.budget_max
    ? `${lead.budget_min ? formatCurrency(lead.budget_min) : '?'} - ${lead.budget_max ? formatCurrency(lead.budget_max) : '?'}`
    : 'not specified';
  return [
    `Name: ${lead.full_name}`,
    `Phone: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : null,
    `Source: ${lead.source}`,
    `Status: ${lead.status}`,
    `Temperature: ${lead.temperature}`,
    lead.property_type ? `Looking for: ${lead.property_type}` : null,
    lead.preferred_location ? `Preferred location: ${lead.preferred_location}` : null,
    `Budget: ${budget}`,
    lead.notes ? `Notes: ${lead.notes}` : null,
    lead.next_follow_up ? `Next follow-up: ${lead.next_follow_up}` : null,
    lead.last_contacted_at ? `Last contacted: ${lead.last_contacted_at}` : null,
  ].filter(Boolean).join('\n');
}

function formatActivities(activities: any[]) {
  if (!activities?.length) return 'No activity yet.';
  return activities.slice(0, 10).map((a) =>
    `- [${new Date(a.created_at).toLocaleDateString()}] ${a.type}: ${a.title}${a.description ? ' — ' + a.description : ''}`,
  ).join('\n');
}

/* ---------------------------- Public actions ----------------------------- */

export async function draftFollowUpMessage(
  leadId: string,
  channel: 'whatsapp' | 'sms' | 'email',
  tone: 'friendly' | 'professional' | 'urgent' = 'friendly',
) {
  const { config, error } = await getOrgAiConfig();
  if (error) return { error };

  const supabase = await createServerSupabaseClient();
  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return { error: 'Lead not found' };

  const channelGuide = channel === 'email'
    ? 'Write a short email with a one-line subject prefixed "Subject: " on the first line.'
    : 'Write a short WhatsApp/SMS message (under 60 words). No subject line. Plain text.';

  const messages = [
    {
      role: 'system' as const,
      content: 'You are an experienced real estate sales agent. Write helpful, warm, non-spammy follow-up messages in clear English. Never make up specific property details, prices, or dates — only use the lead\'s known context.',
    },
    {
      role: 'user' as const,
      content: `Draft a ${tone} follow-up ${channel} message for this lead.\n\n${formatLeadContext(lead)}\n\n${channelGuide}\n\nReturn only the message text, no preamble.`,
    },
  ];

  try {
    const text = await generateText(config!, messages, { temperature: 0.8, maxTokens: 300 });
    return { text };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'AI request failed' };
  }
}

export async function summarizeLead(leadId: string) {
  const { config, error } = await getOrgAiConfig();
  if (error) return { error };

  const supabase = await createServerSupabaseClient();
  const [{ data: lead }, { data: activities }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', leadId).single(),
    supabase.from('activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(15),
  ]);
  if (!lead) return { error: 'Lead not found' };

  const messages = [
    {
      role: 'system' as const,
      content: 'You summarize sales leads for busy real estate agents. Be specific, factual, under 70 words. Use bullet points. No fluff.',
    },
    {
      role: 'user' as const,
      content: `Summarize this lead in 3-5 bullet points (current status, key preferences, recent activity, recommended attention level).\n\nLEAD:\n${formatLeadContext(lead)}\n\nRECENT ACTIVITY:\n${formatActivities(activities || [])}`,
    },
  ];

  try {
    const text = await generateText(config!, messages, { temperature: 0.3, maxTokens: 250 });
    return { text };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'AI request failed' };
  }
}

export async function suggestNextAction(leadId: string) {
  const { config, error } = await getOrgAiConfig();
  if (error) return { error };

  const supabase = await createServerSupabaseClient();
  const [{ data: lead }, { data: activities }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', leadId).single(),
    supabase.from('activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(10),
  ]);
  if (!lead) return { error: 'Lead not found' };

  const messages = [
    {
      role: 'system' as const,
      content: 'You advise real estate agents on the single next best action for a lead. Be decisive. Output exactly two short lines:\nACTION: <one specific action>\nWHY: <one sentence reason>\nNothing else.',
    },
    {
      role: 'user' as const,
      content: `LEAD:\n${formatLeadContext(lead)}\n\nRECENT ACTIVITY:\n${formatActivities(activities || [])}\n\nWhat is the single next best action right now?`,
    },
  ];

  try {
    const text = await generateText(config!, messages, { temperature: 0.4, maxTokens: 150 });
    return { text };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'AI request failed' };
  }
}

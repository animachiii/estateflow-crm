/**
 * Unified LLM dispatcher. Supports Gemini, Groq, OpenAI, Anthropic.
 * All providers are called via native fetch — no SDKs.
 *
 * Per-org configuration lives in `integration_settings.ai_provider` + `ai_api_key`.
 * Each provider has a sensible default model that's cheap/fast and good enough
 * for short-form text generation (drafts, summaries, suggestions).
 */

export type AiProvider = 'gemini' | 'groq' | 'openai' | 'anthropic';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model?: string;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.5-flash',
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5',
};

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Google Gemini (Free)',
  groq: 'Groq (Free)',
  openai: 'OpenAI (Paid)',
  anthropic: 'Anthropic Claude (Paid)',
};

export const PROVIDER_KEY_URLS: Record<AiProvider, string> = {
  gemini: 'https://aistudio.google.com/app/apikey',
  groq: 'https://console.groq.com/keys',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
};

/** Tells the caller whether AI is configured. Mostly for UI gating. */
export function isAiConfigured(config: Partial<AiConfig> | null | undefined): config is AiConfig {
  return !!(config && config.provider && config.apiKey);
}

/**
 * Generate text from a chat-style message list.
 * Returns the assistant's text content (trimmed). Throws on provider errors.
 */
export async function generateText(config: AiConfig, messages: AiMessage[], opts?: { maxTokens?: number; temperature?: number }) {
  const model = config.model || DEFAULT_MODELS[config.provider];
  const maxTokens = opts?.maxTokens ?? 600;
  const temperature = opts?.temperature ?? 0.7;

  switch (config.provider) {
    case 'gemini':
      return callGemini(config.apiKey, model, messages, maxTokens, temperature);
    case 'groq':
      return callOpenAiCompatible('https://api.groq.com/openai/v1', config.apiKey, model, messages, maxTokens, temperature);
    case 'openai':
      return callOpenAiCompatible('https://api.openai.com/v1', config.apiKey, model, messages, maxTokens, temperature);
    case 'anthropic':
      return callAnthropic(config.apiKey, model, messages, maxTokens, temperature);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/* --------------------------- Provider adapters --------------------------- */

async function callGemini(apiKey: string, model: string, messages: AiMessage[], maxTokens: number, temperature: number) {
  // Gemini puts system instructions in a separate field.
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
  return text.trim();
}

async function callOpenAiCompatible(baseUrl: string, apiKey: string, model: string, messages: AiMessage[], maxTokens: number, temperature: number) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) throw new Error(`${baseUrl} error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || '').trim();
}

async function callAnthropic(apiKey: string, model: string, messages: AiMessage[], maxTokens: number, temperature: number) {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const chat = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      ...(system ? { system } : {}),
      messages: chat,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data?.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
  return text.trim();
}

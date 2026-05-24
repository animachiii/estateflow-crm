import { isAiConfigured, type AiConfig, type AiProvider } from '@/lib/services/ai-service';

const PROVIDERS: AiProvider[] = ['gemini', 'groq', 'openai', 'anthropic'];

const PROVIDER_ENV: Record<AiProvider, { apiKey: string; model: string }> = {
  gemini: { apiKey: 'GEMINI_API_KEY', model: 'GEMINI_MODEL' },
  groq: { apiKey: 'GROQ_API_KEY', model: 'GROQ_MODEL' },
  openai: { apiKey: 'OPENAI_API_KEY', model: 'OPENAI_MODEL' },
  anthropic: { apiKey: 'ANTHROPIC_API_KEY', model: 'ANTHROPIC_MODEL' },
};

function clean(value: string | undefined) {
  return value?.trim() || undefined;
}

function parseProvider(value: string | undefined): AiProvider | undefined {
  const provider = clean(value);
  return PROVIDERS.includes(provider as AiProvider) ? provider as AiProvider : undefined;
}

export function getVercelAiConfig(): AiConfig | null {
  const explicitProvider = parseProvider(process.env.AI_PROVIDER);

  if (explicitProvider) {
    const providerEnv = PROVIDER_ENV[explicitProvider];
    const config = {
      provider: explicitProvider,
      apiKey: clean(process.env.AI_API_KEY) || clean(process.env[providerEnv.apiKey]),
      model: clean(process.env.AI_MODEL) || clean(process.env[providerEnv.model]),
    };

    return isAiConfigured(config) ? config : null;
  }

  for (const provider of PROVIDERS) {
    const providerEnv = PROVIDER_ENV[provider];
    const config = {
      provider,
      apiKey: clean(process.env[providerEnv.apiKey]),
      model: clean(process.env.AI_MODEL) || clean(process.env[providerEnv.model]),
    };

    if (isAiConfigured(config)) return config;
  }

  return null;
}

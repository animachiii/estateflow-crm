-- AI provider configuration on integration_settings.
-- Adds a unified provider/key/model so an org can pick any supported LLM.

alter table integration_settings
  add column if not exists ai_provider text
    check (ai_provider in ('gemini', 'groq', 'openai', 'anthropic'))
    default 'gemini',
  add column if not exists ai_api_key text,
  add column if not exists ai_model text;

-- Backfill: if an OpenAI key exists, default the provider to openai for that org.
update integration_settings
set ai_provider = 'openai',
    ai_api_key = openai_api_key
where openai_api_key is not null and openai_api_key <> '' and ai_api_key is null;

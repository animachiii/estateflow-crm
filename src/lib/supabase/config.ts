const SETUP_ERROR =
  'Supabase is not configured. Update .env.local with your real Supabase project URL and keys, then restart the server.';

function isMissingOrPlaceholder(value: string | undefined) {
  return !value || /your-project|placeholder|example/i.test(value);
}

export function getSupabaseSetupError() {
  if (
    isMissingOrPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    isMissingOrPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    isMissingOrPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    return SETUP_ERROR;
  }

  return null;
}

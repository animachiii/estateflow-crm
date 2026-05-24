import 'server-only';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function normalizeUrl(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function isLocalUrl(value: string) {
  try {
    return LOCAL_HOSTNAMES.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function getConfiguredPublicAppUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].map(normalizeUrl);

  return candidates.find((candidate) => candidate && !isLocalUrl(candidate)) || '';
}

export function getBestAppUrl(fallback?: string) {
  const publicUrl = getConfiguredPublicAppUrl();
  if (publicUrl) return publicUrl;

  const normalizedFallback = normalizeUrl(fallback);
  if (normalizedFallback) return normalizedFallback;

  const configuredAppUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  return configuredAppUrl || 'http://localhost:3000';
}

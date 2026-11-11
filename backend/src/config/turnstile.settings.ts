export interface TurnstileSettings {
  enabled: boolean;
  siteKey: string | null;
  secretKey: string | null;
  verifyUrl: string;
  timeoutMs: number;
}

const DEFAULT_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEFAULT_TIMEOUT_MS = 5_000;

function stringValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

// CAPTCHA is opt-out only outside production: a fresh test/development clone
// boots without keys, while a production deployment without an explicit
// TURNSTILE_ENABLED value fails validation instead of silently disabling it.
export function readTurnstileSettings(env: Record<string, unknown>): TurnstileSettings {
  const environment = String(env['NODE_ENV'] ?? 'development').toLowerCase();
  const enabledByDefault = environment === 'production' || environment === 'staging';
  const timeout = Number(env['TURNSTILE_TIMEOUT_MS'] ?? DEFAULT_TIMEOUT_MS);

  return {
    enabled: booleanValue(env['TURNSTILE_ENABLED'], enabledByDefault),
    siteKey: stringValue(env['TURNSTILE_SITE_KEY']),
    secretKey: stringValue(env['TURNSTILE_SECRET_KEY']),
    verifyUrl: stringValue(env['TURNSTILE_VERIFY_URL']) ?? DEFAULT_VERIFY_URL,
    timeoutMs:
      Number.isInteger(timeout) && timeout >= 1_000 && timeout <= 15_000
        ? timeout
        : DEFAULT_TIMEOUT_MS,
  };
}

export { DEFAULT_TIMEOUT_MS, DEFAULT_VERIFY_URL };

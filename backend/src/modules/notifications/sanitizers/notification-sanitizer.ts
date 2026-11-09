// notification-sanitizer.ts
// Masquage PII pour NTF-01 : aucun log, aucune réponse API publique et aucun
// payload DeadLetterJob ne doit contenir un email complet, un téléphone complet
// ni le contenu complet d'un message.

export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '[INVALID]';
  const normalized = email.trim().toLowerCase();
  const sepIndex = normalized.lastIndexOf('@');
  if (sepIndex < 1 || sepIndex === normalized.length - 1) {
    return '[INVALID]';
  }
  const local = normalized.slice(0, sepIndex);
  const domain = normalized.slice(sepIndex + 1);
  if (!local || !domain) return '[INVALID]';
  return `${local[0]}${'*'.repeat(Math.max(3, local.length - 1))}@${domain}`;
}

export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string' || phone.length < 6) {
    return '[INVALID]';
  }
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 6) return '[INVALID]';
  const head = cleaned.slice(0, 4);
  const tail = cleaned.slice(-2);
  return `${head}****${tail}`;
}

type SanitizablePrimitive = string;
type SanitizableValue =
  | SanitizablePrimitive
  | number
  | boolean
  | null
  | undefined
  | SanitizableValue[]
  | { [key: string]: SanitizableValue };
type SanitizedValue = Exclude<SanitizableValue, SanitizablePrimitive>;

const PII_FIELDS = new Set([
  'email',
  'to',
  'recipient',
  'phone',
  'address',
  'fullName',
  'name',
  'message',
  'html',
  'subject',
  'text',
  'body',
]);

/* eslint-disable @typescript-eslint/no-unused-vars */
function sanitizePrimitive(value: SanitizablePrimitive): SanitizedValue {
  if (value.length > 6 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return sanitizeEmail(value) as SanitizedValue;
  }
  if (/^\+?\d{6,}$/.test(value.replace(/[^\d+]/g, ''))) {
    return sanitizePhone(value) as SanitizedValue;
  }
  return value as SanitizedValue;
}

export function sanitizeNotificationPayload(payload: SanitizableValue): SanitizedValue {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeNotificationPayload(item)) as SanitizedValue;
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, SanitizableValue>;
    const out: Record<string, SanitizedValue> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (PII_FIELDS.has(key) && typeof value === 'string') {
        out[key] =
          value.length > 6 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? sanitizeEmail(value)
            : sanitizePhone(value);
      } else {
        out[key] = sanitizeNotificationPayload(value);
      }
    }
    return out;
  }
  return payload as SanitizedValue;
}

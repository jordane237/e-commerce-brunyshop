// Parses human durations from the environment ("15m", "30d", "45s").
// Plain numbers are interpreted as minutes (documented in .env.example).
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = (match[2] ?? 'm').toLowerCase();
  const factor: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * factor[unit];
}

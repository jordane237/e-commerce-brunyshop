export const ThrottleConfig = {
  REGISTER: { limit: 5, ttl: 60_000 }, // 5 inscriptions / min / IP
  LOGIN: { limit: 10, ttl: 60_000 }, // 10 tentatives / min / IP
  FORGOT_PASSWORD: { limit: 3, ttl: 60_000 }, // Prêt pour futur ticket
  REFRESH: { limit: 30, ttl: 60_000 }, // 30 refresh / min / IP
  LOGOUT: { limit: 20, ttl: 60_000 }, // 20 logout / min / IP
} as const;

export const LOGIN_MAX_FAILED_ATTEMPTS = 5; // seuil verrouillage
export const LOGIN_LOCKOUT_DURATION_MS = 15 * 60_000; // 15 minutes
export const LOGIN_FAILED_WINDOW_MS = 15 * 60_000; // fenêtre de comptage
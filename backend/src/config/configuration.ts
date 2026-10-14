// Typed application configuration derived from validated environment variables.
import { Environment } from './env.validation';

export interface AuthConfig {
  secret: string;
  accessTtl: string;
  refreshTtl: string;
  cookieDomain?: string;
  cookieSecure: boolean;
}

export interface ApplicationConfig {
  environment: Environment;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  publicAppUrl: string;
  publicAdminUrl: string;
  corsOrigins: string[];
  throttle: { ttlSeconds: number; limit: number };
  auth: AuthConfig;
  isProduction: boolean;
}

export function loadApplicationConfig(env: Record<string, unknown>): ApplicationConfig {
  const environment = env['NODE_ENV'] as Environment;
  const corsOrigins = String(env['CORS_ORIGINS'])
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    environment,
    port: Number(env['PORT']),
    databaseUrl: String(env['DATABASE_URL']),
    redisUrl: String(env['REDIS_URL']),
    publicAppUrl: String(env['APP_PUBLIC_URL']),
    publicAdminUrl: String(env['ADMIN_PUBLIC_URL']),
    corsOrigins,
    throttle: {
      ttlSeconds: Number(env['THROTTLE_TTL']),
      limit: Number(env['THROTTLE_LIMIT']),
    },
    auth: {
      // Cachier 10.2: access JWT 10-15 min, rotating refresh cookie.
      secret: String(env['JWT_ACCESS_SECRET']),
      accessTtl: String(env['JWT_ACCESS_TTL'] ?? '15m'),
      refreshTtl: String(env['REFRESH_TOKEN_TTL'] ?? '30d'),
      cookieDomain: env['COOKIE_DOMAIN'] ? String(env['COOKIE_DOMAIN']) : undefined,
      // Secure requires HTTPS; disabled outside production (local http).
      cookieSecure: environment === Environment.Production,
    },
    isProduction: environment === Environment.Production,
  };
}

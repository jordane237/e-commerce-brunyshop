// Typed application configuration derived from validated environment variables.
import { Environment } from './env.validation';

export interface ApplicationConfig {
  environment: Environment;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  publicAppUrl: string;
  publicAdminUrl: string;
  corsOrigins: string[];
  throttle: { ttlSeconds: number; limit: number };
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
    isProduction: environment === Environment.Production,
  };
}

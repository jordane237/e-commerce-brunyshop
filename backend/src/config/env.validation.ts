// Environment variable schema validation.
// The application refuses to start when a required variable is missing or invalid.
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

export class EnvVariables {
  @IsEnum(Environment)
  public NODE_ENV!: Environment;

  @IsInt()
  @Min(1)
  public PORT!: number;

  @IsString()
  @Matches(/postgres/i)
  public DATABASE_URL!: string;

  @IsString()
  @Matches(/^rediss?:\/\//)
  public REDIS_URL!: string;

  // Comma-separated allowed origins (whitelist).
  @IsString()
  public CORS_ORIGINS!: string;

  @IsString()
  public APP_PUBLIC_URL!: string;

  @IsString()
  public ADMIN_PUBLIC_URL!: string;

  @IsInt()
  @Min(1)
  public THROTTLE_TTL!: number;

  @IsInt()
  @Min(1)
  public THROTTLE_LIMIT!: number;

  // Signs access JWTs (>= 48 chars, see .env.example).
  @IsString()
  @MinLength(48)
  public JWT_ACCESS_SECRET!: string;

  // Access token lifetime, e.g. "15m" (cachier 10.2: 10-15 min).
  @IsOptional()
  @IsString()
  public JWT_ACCESS_TTL?: string;

  // Refresh cookie lifetime, e.g. "30d".
  @IsOptional()
  @IsString()
  public REFRESH_TOKEN_TTL?: string;

  @IsOptional()
  @IsString()
  public COOKIE_DOMAIN?: string;

  // --- Seed (TEC-07) ---------------------------------------------------
  // Email and password of the development super admin (never hard-coded).
  @IsOptional()
  @IsString()
  public SEED_SUPER_ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  @MinLength(12)
  public SEED_SUPER_ADMIN_PASSWORD?: string;

  // When 'true', the super admin password is reset on every seed run.
  @IsOptional()
  @IsString()
  public SEED_FORCE_PASSWORD_RESET?: string;

  // Demo customer password (>= 12 chars).
  @IsOptional()
  @IsString()
  @MinLength(12)
  public SEED_CUSTOMER_PASSWORD?: string;

  // Allow the seed to run in production (dangerous).
  @IsOptional()
  @IsString()
  public ALLOW_SEED_IN_PRODUCTION?: string;

  // Storage (MinIO / S3)
  @IsOptional()
  @IsString()
  public STORAGE_DRIVER?: string;

  @IsOptional()
  @IsString()
  public S3_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  public S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  public S3_REGION?: string;

  @IsOptional()
  @IsString()
  public S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  public S3_SECRET_ACCESS_KEY?: string;

  // Mail
  @IsOptional()
  @IsString()
  public MAIL_DRIVER?: string;

  @IsOptional()
  @IsString()
  public MAIL_FROM?: string;

  @IsOptional()
  @IsString()
  public SMTP_HOST?: string;

  @IsOptional()
  @IsString()
  public SMTP_PORT?: string;

  @IsOptional()
  @IsString()
  public SMTP_USER?: string;

  @IsOptional()
  @IsString()
  public SMTP_PASSWORD?: string;

  // SMS
  @IsOptional()
  @IsString()
  public SMS_DRIVER?: string;

  @IsOptional()
  @IsString()
  public SMS_PROVIDER?: string;

  @IsOptional()
  @IsString()
  public SMS_API_KEY?: string;

  // WhatsApp
  @IsOptional()
  @IsString()
  public WHATSAPP_DRIVER?: string;

  @IsOptional()
  @IsString()
  public WHATSAPP_TOKEN?: string;

  // Payments
  @IsOptional()
  @IsString()
  public PAYMENT_PROVIDER?: string;

  @IsOptional()
  @IsString()
  public PAYMENT_WEBHOOK_SECRET?: string;

  // Monitoring
  @IsOptional()
  @IsString()
  public SENTRY_DSN?: string;
}

// Synchronous on purpose: @nestjs/config v12 stores the result of `validate`
// without awaiting it, so an async validator would silently replace the whole
// environment config with a pending Promise (missing keys at runtime).
// Returns the raw config (strings untouched) after enforcing the schema.
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated);
  if (errors.length > 0) {
    const details = errors
      .map((error) => `  ${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  const origins = String(config.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim());
  if (origins.length === 0 || origins.some((origin) => !/^https?:\/\/[^\s,]+$/.test(origin))) {
    throw new Error(
      'Invalid environment variables:\n  CORS_ORIGINS: must contain comma-separated HTTP(S) origins',
    );
  }
  return config;
}

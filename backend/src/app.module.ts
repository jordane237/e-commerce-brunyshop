import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

import { validateEnv } from './config/env.validation';
import { loadApplicationConfig } from './config/configuration';
import { CacheModule, RedisService } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Validated configuration: the app refuses to start on invalid env vars.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [(): Record<string, unknown> => ({ app: loadApplicationConfig(process.env) })],
    }),
    // Structured logging with request ids and sensitive field redaction.
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<boolean>('app.isProduction') === true ? 'info' : 'debug',
          transport:
            config.get<boolean>('app.isProduction') === true
              ? undefined
              : { target: 'pino-pretty' },
          genReqId: (
            req: { headers: Record<string, string | string[] | undefined> },
            res: { setHeader: (name: string, value: string) => void },
          ): string => {
            const incoming = req.headers['x-request-id'];
            const requestId = typeof incoming === 'string' ? incoming : randomUUID();
            res.setHeader('X-Request-Id', requestId);
            return requestId;
          },
          autoLogging: {
            ignore: (req: {
              headers: Record<string, string | string[] | undefined>;
              url?: string;
            }): boolean => Boolean(req.url?.includes('/health')),
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              '*.password',
              '*.token',
              'password',
              'refreshToken',
            ],
            censor: '[REDACTED]',
          },
        },
      }),
    }),
    // Global rate limiting backed by Redis (shared connection).
    ThrottlerModule.forRootAsync({
      imports: [CacheModule],
      inject: [ConfigService, RedisService],
      useFactory: (
        config: ConfigService,
        redisService: RedisService,
      ): {
        throttlers: Array<{ ttl: number; limit: number }>;
        storage: ThrottlerStorageRedisService;
      } => ({
        throttlers: [
          {
            ttl: Number(config.get('app.throttle.ttlSeconds')) * 1000,
            limit: Number(config.get('app.throttle.limit')),
          },
        ],
        storage: new ThrottlerStorageRedisService(redisService.redis),
      }),
    }),
    // Shared infrastructure (exported services).
    DatabaseModule,
    CacheModule,
    // Public health endpoints (liveness/readiness).
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      // Refusal by default: every route is guarded unless explicitly open.
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from './infrastructure/queue/queue.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { randomUUID } from 'node:crypto';

import { validateEnv } from './config/env.validation';
import { loadApplicationConfig } from './config/configuration';
import { CacheModule, RedisService } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Validated configuration: the app refuses to start on invalid env vars.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['../.env', '.env'],
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
              '*.email',
              '*.phone',
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
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = new URL(config.getOrThrow<string>('REDIS_URL'));
        return {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port || 6379),
            username: redisUrl.username || undefined,
            password: redisUrl.password || undefined,
            db: redisUrl.pathname.length > 1 ? Number(redisUrl.pathname.slice(1)) : 0,
            ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
          },
        };
      },
    }),
    QueueModule,
    StorageModule,
    // Authentication (cachier §9 contract).
    AuthModule,
    // Access JWT signing (global: guards and services resolve JwtService).
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    // Public health endpoints (liveness/readiness).
    HealthModule,
    CatalogModule,
    InventoryModule,
    UsersModule,
    RolesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    PromotionsModule,
    ReviewsModule,
    WishlistModule,
    NotificationsModule,
    AnalyticsModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      // Refusal by default: every route requires an access token unless @Public.
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      // RBAC on top of authentication (@Roles, cachier §2 matrix).
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      // Rate limiting on top of both (Redis storage).
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

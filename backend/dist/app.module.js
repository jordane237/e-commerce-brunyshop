"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const throttler_1 = require("@nestjs/throttler");
const throttler_storage_redis_1 = require("@nest-lab/throttler-storage-redis");
const nestjs_pino_1 = require("nestjs-pino");
const bullmq_1 = require("@nestjs/bullmq");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const queue_module_1 = require("./infrastructure/queue/queue.module");
const storage_module_1 = require("./infrastructure/storage/storage.module");
const node_crypto_1 = require("node:crypto");
const env_validation_1 = require("./config/env.validation");
const configuration_1 = require("./config/configuration");
const cache_module_1 = require("./infrastructure/cache/cache.module");
const database_module_1 = require("./infrastructure/database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const health_module_1 = require("./modules/health/health.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const cart_module_1 = require("./modules/cart/cart.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const shipping_module_1 = require("./modules/shipping/shipping.module");
const promotions_module_1 = require("./modules/promotions/promotions.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const wishlist_module_1 = require("./modules/wishlist/wishlist.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const settings_module_1 = require("./modules/settings/settings.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Validated configuration: the app refuses to start on invalid env vars.
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                envFilePath: ['../.env', '.env'],
                validate: env_validation_1.validateEnv,
                load: [() => ({ app: (0, configuration_1.loadApplicationConfig)(process.env) })],
            }),
            // Structured logging with request ids and sensitive field redaction.
            nestjs_pino_1.LoggerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    pinoHttp: {
                        level: config.get('app.isProduction') === true ? 'info' : 'debug',
                        transport: config.get('app.isProduction') === true
                            ? undefined
                            : { target: 'pino-pretty' },
                        genReqId: (req, res) => {
                            const incoming = req.headers['x-request-id'];
                            const requestId = typeof incoming === 'string' ? incoming : (0, node_crypto_1.randomUUID)();
                            res.setHeader('X-Request-Id', requestId);
                            return requestId;
                        },
                        autoLogging: {
                            ignore: (req) => Boolean(req.url?.includes('/health')),
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
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [cache_module_1.CacheModule],
                inject: [config_1.ConfigService, cache_module_1.RedisService],
                useFactory: (config, redisService) => ({
                    throttlers: [
                        {
                            ttl: Number(config.get('app.throttle.ttlSeconds')) * 1000,
                            limit: Number(config.get('app.throttle.limit')),
                        },
                    ],
                    storage: new throttler_storage_redis_1.ThrottlerStorageRedisService(redisService.redis),
                }),
            }),
            // Shared infrastructure (exported services).
            database_module_1.DatabaseModule,
            cache_module_1.CacheModule,
            event_emitter_1.EventEmitterModule.forRoot(),
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const redisUrl = new URL(config.getOrThrow('REDIS_URL'));
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
            queue_module_1.QueueModule,
            storage_module_1.StorageModule,
            // Authentication (cachier §9 contract).
            auth_module_1.AuthModule,
            // Access JWT signing (global: guards and services resolve JwtService).
            jwt_1.JwtModule.registerAsync({
                global: true,
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.getOrThrow('JWT_ACCESS_SECRET'),
                }),
            }),
            // Public health endpoints (liveness/readiness).
            health_module_1.HealthModule,
            catalog_module_1.CatalogModule,
            inventory_module_1.InventoryModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            cart_module_1.CartModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            shipping_module_1.ShippingModule,
            promotions_module_1.PromotionsModule,
            reviews_module_1.ReviewsModule,
            wishlist_module_1.WishlistModule,
            notifications_module_1.NotificationsModule,
            analytics_module_1.AnalyticsModule,
            settings_module_1.SettingsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                // Refusal by default: every route requires an access token unless @Public.
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                // RBAC on top of authentication (@Roles, cachier §2 matrix).
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                // Rate limiting on top of both (Redis storage).
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);

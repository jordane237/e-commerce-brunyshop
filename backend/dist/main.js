"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// BRUNY SHOPPING API — application bootstrap.
// Security-first setup: helmet, CORS whitelist, global validation, request body
// limits, versioned REST prefix, structured logs and dev-only Swagger.
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const app_module_1 = require("./app.module");
const nestjs_pino_1 = require("nestjs-pino");
const BODY_SIZE_LIMIT = '32kb'; // No endpoint legitimately receives big payloads at step 3.
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    // Route process logs through the structured logger (pino).
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const config = app.get(config_1.ConfigService);
    const appConfig = config.get('app');
    if (!appConfig) {
        throw new Error('Application configuration missing after validation');
    }
    // Security headers (HSTS enforced in production).
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: appConfig.isProduction
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    fontSrc: ["'self'", 'data:'],
                    connectSrc: ["'self'", ...appConfig.corsOrigins],
                    objectSrc: ["'none'"],
                    baseUri: ["'self'"],
                    frameAncestors: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            }
            : false,
        hsts: appConfig.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }));
    app.use((0, express_1.json)({ limit: BODY_SIZE_LIMIT }));
    app.use((0, cookie_parser_1.default)());
    // CORS whitelist: only configured storefront/admin origins.
    await app.enableCors({
        origin: appConfig.corsOrigins,
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    // Strict global validation, refusal by default.
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(config));
    // REST API versioning: /api/v1/...
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    // Interactive API documentation outside of production only.
    if (!appConfig.isProduction) {
        const document = swagger_1.SwaggerModule.createDocument(app, new swagger_1.DocumentBuilder()
            .setTitle('BRUNY SHOPPING API')
            .setDescription('BRUNY SHOPPING e-commerce contract (prices in FCFA).')
            .setVersion('1.0')
            .build());
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    // Graceful shutdown hooks (finish in-flight requests before stopping).
    app.enableShutdownHooks();
    await app.listen(appConfig.port);
}
void bootstrap();

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvVariables = exports.Environment = void 0;
exports.validateEnv = validateEnv;
// Environment variable schema validation.
// The application refuses to start when a required variable is missing or invalid.
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var Environment;
(function (Environment) {
    Environment["Development"] = "development";
    Environment["Staging"] = "staging";
    Environment["Production"] = "production";
})(Environment || (exports.Environment = Environment = {}));
class EnvVariables {
    NODE_ENV;
    PORT;
    DATABASE_URL;
    REDIS_URL;
    // Comma-separated allowed origins (whitelist).
    CORS_ORIGINS;
    APP_PUBLIC_URL;
    ADMIN_PUBLIC_URL;
    THROTTLE_TTL;
    THROTTLE_LIMIT;
    // Signs access JWTs (>= 48 chars, see .env.example).
    JWT_ACCESS_SECRET;
    // Access token lifetime, e.g. "15m" (cachier 10.2: 10-15 min).
    JWT_ACCESS_TTL;
    // Refresh cookie lifetime, e.g. "30d".
    REFRESH_TOKEN_TTL;
    COOKIE_DOMAIN;
    SEED_ADMIN_EMAIL;
    SEED_ADMIN_PASSWORD;
    STORAGE_DRIVER;
    S3_ENDPOINT;
    S3_BUCKET;
    S3_REGION;
    S3_ACCESS_KEY_ID;
    S3_SECRET_ACCESS_KEY;
    CLOUDINARY_URL;
    MAIL_DRIVER;
    MAIL_FROM;
    SMTP_HOST;
    SMTP_PORT;
    SMTP_USER;
    SMTP_PASSWORD;
    SMS_DRIVER;
    SMS_PROVIDER;
    SMS_API_KEY;
    WHATSAPP_DRIVER;
    WHATSAPP_TOKEN;
    PAYMENT_PROVIDER;
    PAYMENT_WEBHOOK_SECRET;
    SENTRY_DSN;
}
exports.EnvVariables = EnvVariables;
__decorate([
    (0, class_validator_1.IsEnum)(Environment),
    __metadata("design:type", String)
], EnvVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EnvVariables.prototype, "PORT", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^postgres(?:ql)?:\/\//),
    __metadata("design:type", String)
], EnvVariables.prototype, "DATABASE_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^rediss?:\/\//),
    __metadata("design:type", String)
], EnvVariables.prototype, "REDIS_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "CORS_ORIGINS", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "APP_PUBLIC_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "ADMIN_PUBLIC_URL", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EnvVariables.prototype, "THROTTLE_TTL", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EnvVariables.prototype, "THROTTLE_LIMIT", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(48),
    __metadata("design:type", String)
], EnvVariables.prototype, "JWT_ACCESS_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "JWT_ACCESS_TTL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "REFRESH_TOKEN_TTL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "COOKIE_DOMAIN", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SEED_ADMIN_EMAIL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SEED_ADMIN_PASSWORD", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "STORAGE_DRIVER", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "S3_ENDPOINT", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "S3_BUCKET", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "S3_REGION", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "S3_ACCESS_KEY_ID", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "S3_SECRET_ACCESS_KEY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "CLOUDINARY_URL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "MAIL_DRIVER", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "MAIL_FROM", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SMTP_HOST", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SMTP_PORT", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SMTP_USER", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SMTP_PASSWORD", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SMS_DRIVER", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SMS_PROVIDER", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SMS_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "WHATSAPP_DRIVER", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "WHATSAPP_TOKEN", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "PAYMENT_PROVIDER", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "PAYMENT_WEBHOOK_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SENTRY_DSN", void 0);
// Synchronous on purpose: @nestjs/config v12 stores the result of `validate`
// without awaiting it, so an async validator would silently replace the whole
// environment config with a pending Promise (missing keys at runtime).
// Returns the raw config (strings untouched) after enforcing the schema.
function validateEnv(config) {
    const validated = (0, class_transformer_1.plainToInstance)(EnvVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = (0, class_validator_1.validateSync)(validated);
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
        throw new Error('Invalid environment variables:\n  CORS_ORIGINS: must contain comma-separated HTTP(S) origins');
    }
    return config;
}

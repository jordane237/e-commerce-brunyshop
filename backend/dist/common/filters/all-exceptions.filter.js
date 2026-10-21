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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
// Global exception filter: every error follows the same normalized shape and
// never leaks technical details in production.
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    config;
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    constructor(config) {
        this.config = config;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isProduction = this.config.get('NODE_ENV') === 'production';
        const { status, code, message, errors } = this.normalize(exception, isProduction);
        const body = {
            statusCode: status,
            code,
            message,
            errors,
            requestId: request.id ?? String(request.headers['x-request-id'] ?? 'unknown'),
            timestamp: new Date().toISOString(),
        };
        this.logger.error({ err: exception }, `request failed ${request.url}`);
        response.status(status).json(body);
    }
    normalize(exception, isProduction) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const payload = exception.getResponse();
            const payloadObject = (typeof payload === 'object' && payload !== null ? payload : {});
            // Business codes (INVALID_CREDENTIALS, TOO_MANY_ATTEMPTS, ...) are
            // carried by the exception payload and must survive normalization.
            const customCode = typeof payloadObject['code'] === 'string' && payloadObject['code']
                ? payloadObject['code']
                : this.codeFor(status);
            const { message, errors } = this.readMessage(payloadObject['message'], exception.message);
            return {
                status,
                code: customCode,
                message: isProduction ? 'An error occurred while processing your request.' : message,
                errors,
            };
        }
        return {
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'INTERNAL_ERROR',
            message: isProduction
                ? 'An error occurred while processing your request.'
                : String(exception),
            errors: [],
        };
    }
    // Payload messages arrive either as a plain string, an array of strings
    // (ValidationPipe default) or an array of class-validator errors.
    readMessage(raw, fallback) {
        if (typeof raw === 'string') {
            return { message: raw, errors: [] };
        }
        if (Array.isArray(raw)) {
            const structured = raw.filter((item) => typeof item === 'object' && item !== null && 'property' in item);
            if (structured.length === raw.length && structured.length > 0) {
                return {
                    message: structured
                        .map((item) => Object.values(item.constraints ?? {}).join(', '))
                        .join(', '),
                    errors: structured.map((item) => ({
                        field: item.property ?? '',
                        message: Object.values(item.constraints ?? {}).join(', '),
                    })),
                };
            }
            const lines = raw
                .map((item) => (typeof item === 'string' ? item : String(item)))
                .filter(Boolean);
            if (lines.length > 0) {
                return { message: lines.join(', '), errors: [] };
            }
        }
        return { message: fallback, errors: [] };
    }
    codeFor(status) {
        const map = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'VALIDATION_ERROR',
            429: 'RATE_LIMITED',
            500: 'INTERNAL_ERROR',
            503: 'SERVICE_UNAVAILABLE',
        };
        return map[status] ?? 'ERROR';
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AllExceptionsFilter);

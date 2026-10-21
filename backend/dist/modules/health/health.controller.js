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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const database_module_1 = require("../../infrastructure/database/database.module");
const cache_module_1 = require("../../infrastructure/cache/cache.module");
const public_decorator_1 = require("../../common/decorators/public.decorator");
// Liveness/readiness answer unauthenticated: Docker healthchecks and probes
// cannot carry a token.
let HealthController = class HealthController {
    healthCheckService;
    prismaHealthIndicator;
    healthIndicatorService;
    prismaService;
    redisService;
    constructor(healthCheckService, prismaHealthIndicator, healthIndicatorService, prismaService, redisService) {
        this.healthCheckService = healthCheckService;
        this.prismaHealthIndicator = prismaHealthIndicator;
        this.healthIndicatorService = healthIndicatorService;
        this.prismaService = prismaService;
        this.redisService = redisService;
    }
    async live() {
        // Liveness: the process itself is up and serving requests.
        return this.healthCheckService.check([
            () => this.healthIndicatorService.check('app').up(),
        ]);
    }
    async ready() {
        // Readiness: dependencies (database + Redis) must answer.
        return this.healthCheckService.check([
            this.prismaHealthIndicator.pingCheck('database', this.prismaService.prisma),
            async () => this.checkRedis(),
        ]);
    }
    async checkRedis() {
        try {
            await this.redisService.redis.ping();
            return this.healthIndicatorService.check('redis').up();
        }
        catch {
            return this.healthIndicatorService.check('redis').down({ message: 'redis unreachable' });
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('live'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
exports.HealthController = HealthController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.PrismaHealthIndicator,
        terminus_1.HealthIndicatorService,
        database_module_1.PrismaService,
        cache_module_1.RedisService])
], HealthController);

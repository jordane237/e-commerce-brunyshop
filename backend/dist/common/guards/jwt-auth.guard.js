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
exports.jwtAuthGuardProvider = exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../decorators/public.decorator");
// Value import: emitDecoratorMetadata needs the class for constructor DI.
const database_module_1 = require("../../infrastructure/database/database.module");
// Global authentication guard: every route requires a valid Bearer access
// token unless explicitly marked @Public (refusal by default).
let JwtAuthGuard = class JwtAuthGuard {
    jwtService;
    reflector;
    prisma;
    constructor(jwtService, reflector, prisma) {
        this.jwtService = jwtService;
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const header = request.headers.authorization;
        const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
        if (!token) {
            throw new common_1.UnauthorizedException({ code: 'UNAUTHENTICATED' });
        }
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token);
        }
        catch {
            throw new common_1.UnauthorizedException({ code: 'INVALID_TOKEN' });
        }
        if (payload.typ !== 'access') {
            throw new common_1.UnauthorizedException({ code: 'INVALID_TOKEN' });
        }
        // Identity is re-read from the database: role/status changes apply
        // immediately, a deleted or disabled account never passes (§10.1 IDOR).
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { roles: { include: { role: true } } },
        });
        if (!user || user.deletedAt || user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException({ code: 'INVALID_TOKEN' });
        }
        request.user = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            roles: user.roles.map((entry) => entry.role.name),
            twoFactorEnabled: user.twoFactorSecret !== null,
        };
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector,
        database_module_1.PrismaService])
], JwtAuthGuard);
// Factory-friendly marker used by AppModule registration.
exports.jwtAuthGuardProvider = JwtAuthGuard;

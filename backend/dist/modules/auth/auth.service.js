"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.REFRESH_COOKIE_NAME = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const argon2_1 = require("@node-rs/argon2");
const node_crypto_1 = require("node:crypto");
const otpauth = __importStar(require("otpauth"));
const database_module_1 = require("../../infrastructure/database/database.module");
const mail_service_1 = require("../../infrastructure/mail/mail.service");
const cache_module_1 = require("../../infrastructure/cache/cache.module");
const duration_1 = require("../../common/utils/duration");
const crypto_1 = require("../../common/utils/crypto");
const password_1 = require("../../common/utils/password");
exports.REFRESH_COOKIE_NAME = 'bruny_refresh';
// Cachier BOA-01: temporary lockout after repeated failures.
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 15 * 60;
const LOCK_KEY_PREFIX = 'auth:lock:';
// Cachier §10.2: single-use reset code, short lifespan.
const RESET_TTL_SECONDS = 15 * 60;
const RESET_KEY_PREFIX = 'auth:reset:';
const PRIVILEGED_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const CHALLENGE_TTL = '5m';
const BACKUP_CODE_COUNT = 10;
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    config;
    redisService;
    mail;
    logger = new common_1.Logger(AuthService_1.name);
    dummyHash;
    constructor(prisma, jwt, config, redisService, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.redisService = redisService;
        this.mail = mail;
    }
    // -------------------------------------------------------------------------
    // Registration / login
    // -------------------------------------------------------------------------
    async register(dto, req, res) {
        const email = dto.email?.trim().toLowerCase();
        const phone = dto.phone?.trim();
        if (!email && !phone) {
            throw new common_1.BadRequestException({
                code: 'MISSING_IDENTIFIER',
                message: 'Renseignez un email ou un téléphone.',
            });
        }
        (0, password_1.assertPasswordStrength)(dto.password);
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
                deletedAt: null,
            },
            select: { id: true },
        });
        if (existing) {
            throw new common_1.ConflictException({ code: 'ACCOUNT_EXISTS' });
        }
        const user = await this.prisma.user.create({
            data: {
                email: email ?? null,
                phone: phone ?? null,
                passwordHash: await (0, argon2_1.hash)(dto.password),
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
            },
        });
        this.logger.log(`account created: ${user.id}`);
        return this.issueSession(user.id, [], req, res);
    }
    async login(dto, req, res) {
        const identifier = dto.identifier.trim();
        const lookup = identifier.toLowerCase();
        await this.assertNotLockedOut(lookup);
        const user = await this.prisma.user.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { email: lookup },
                    ...(identifier.startsWith('+') || /^[0-9]+$/.test(identifier)
                        ? [{ phone: identifier }]
                        : []),
                ],
            },
            include: { roles: { include: { role: true } } },
        });
        // Same path whether the account exists or not (timing + generic message).
        const passwordOk = user
            ? await (0, argon2_1.verify)(user.passwordHash, dto.password)
            : await this.verifyAgainstDummy(dto.password);
        if (!user || !passwordOk || user.status !== 'ACTIVE') {
            await this.recordFailedAttempt(lookup);
            throw new common_1.UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
        }
        await this.clearFailures(lookup);
        const roles = user.roles.map((entry) => entry.role.name);
        if (user.twoFactorSecret) {
            return {
                twoFactorRequired: true,
                challengeToken: await this.signChallenge(user.id, 'verify'),
            };
        }
        if (roles.some((role) => PRIVILEGED_ROLES.includes(role))) {
            // Cachier BOA-02: 2FA mandatory for ADMIN/SUPER_ADMIN — the account
            // cannot obtain tokens before the secret is enrolled.
            return {
                twoFactorRequired: true,
                setupRequired: true,
                challengeToken: await this.signChallenge(user.id, 'setup'),
            };
        }
        return this.issueSession(user.id, roles, req, res);
    }
    // -------------------------------------------------------------------------
    // Refresh rotation (cachier §10.2)
    // -------------------------------------------------------------------------
    async refresh(req, res) {
        const cookie = req.cookies[exports.REFRESH_COOKIE_NAME];
        if (!cookie) {
            throw new common_1.UnauthorizedException({ code: 'NO_SESSION' });
        }
        const record = await this.prisma.refreshToken.findUnique({
            where: { tokenHash: (0, crypto_1.sha256hex)(cookie) },
        });
        if (!record) {
            this.clearRefreshCookie(res);
            throw new common_1.UnauthorizedException({ code: 'INVALID_SESSION' });
        }
        if (record.revokedAt) {
            // Reuse of a rotated token: revoke the whole family (cachier §10.2).
            await this.prisma.refreshToken.updateMany({
                where: { familyId: record.familyId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
            this.clearRefreshCookie(res);
            this.logger.warn(`refresh token reuse detected — family ${record.familyId} revoked`);
            throw new common_1.UnauthorizedException({ code: 'SESSION_REUSE_DETECTED' });
        }
        if (record.expiresAt.getTime() <= Date.now()) {
            this.clearRefreshCookie(res);
            throw new common_1.UnauthorizedException({ code: 'SESSION_EXPIRED' });
        }
        const user = await this.prisma.user.findUnique({
            where: { id: record.userId },
            include: { roles: { include: { role: true } } },
        });
        if (!user || user.deletedAt || user.status !== 'ACTIVE') {
            this.clearRefreshCookie(res);
            throw new common_1.UnauthorizedException({ code: 'INVALID_SESSION' });
        }
        // Rotate: revoke the presented token, mint a new one in the same family.
        await this.prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() },
        });
        await this.createRefreshToken(record.userId, record.familyId, req, res);
        const roles = user.roles.map((entry) => entry.role.name);
        return { accessToken: await this.signAccess(user.id, user.email, roles) };
    }
    async logout(req, res) {
        const cookie = req.cookies[exports.REFRESH_COOKIE_NAME];
        if (cookie) {
            const record = await this.prisma.refreshToken.findUnique({
                where: { tokenHash: (0, crypto_1.sha256hex)(cookie) },
            });
            if (record) {
                await this.prisma.refreshToken.updateMany({
                    where: { familyId: record.familyId, revokedAt: null },
                    data: { revokedAt: new Date() },
                });
            }
        }
        this.clearRefreshCookie(res);
        return { ok: true };
    }
    // -------------------------------------------------------------------------
    // Password reset (cachier §10.2: identical answer, single-use code)
    // -------------------------------------------------------------------------
    async forgotPassword(email) {
        const normalized = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: normalized },
            select: { id: true, deletedAt: true },
        });
        if (!user || user.deletedAt) {
            return; // identical 202 response either way
        }
        const code = String((0, node_crypto_1.randomInt)(0, 1_000_000)).padStart(6, '0');
        await this.redisService.redis.set(`${RESET_KEY_PREFIX}${(0, crypto_1.sha256hex)(normalized)}`, (0, crypto_1.sha256hex)(code), 'EX', RESET_TTL_SECONDS);
        try {
            await this.mail.sendPasswordResetCode(normalized, code);
        }
        catch {
            // Never let transport failures reveal account existence.
            this.logger.error('reset mail delivery failed');
        }
    }
    async resetPassword(dto) {
        const email = dto.email.trim().toLowerCase();
        (0, password_1.assertPasswordStrength)(dto.newPassword);
        const stored = await this.redisService.redis.getdel(`${RESET_KEY_PREFIX}${(0, crypto_1.sha256hex)(email)}`);
        if (!stored || stored !== (0, crypto_1.sha256hex)(dto.code)) {
            throw new common_1.BadRequestException({ code: 'INVALID_CODE' });
        }
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.deletedAt) {
            throw new common_1.BadRequestException({ code: 'INVALID_CODE' });
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await (0, argon2_1.hash)(dto.newPassword) },
        });
        // A password change invalidates every issued session.
        await this.prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        this.logger.log(`password reset completed for ${user.id}`);
        return { ok: true };
    }
    // -------------------------------------------------------------------------
    // Two-factor authentication (cachier BOA-02 / BOA-04, §10.2 TOTP)
    // -------------------------------------------------------------------------
    async setupTwoFactor(challengeToken) {
        const userId = await this.requireChallengeUser(challengeToken, 'setup');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
        });
        if (!user) {
            throw new common_1.UnauthorizedException({ code: 'INVALID_TOKEN' });
        }
        const roles = user.roles.map((entry) => entry.role.name);
        if (!roles.some((role) => PRIVILEGED_ROLES.includes(role))) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN' });
        }
        const secret = new otpauth.Secret({ size: 20 });
        await this.prisma.user.update({
            where: { id: user.id },
            data: { twoFactorSecret: (0, crypto_1.encryptSecret)(secret.base32, this.jwtSecret()) },
        });
        // Backup codes: 8 digits, hashed at rest, single use (BOA-04).
        await this.prisma.backupCode.deleteMany({ where: { userId: user.id } });
        const backupCodes = [];
        const records = [];
        for (let i = 0; i < BACKUP_CODE_COUNT; i += 1) {
            const code = String((0, node_crypto_1.randomInt)(0, 100_000_000)).padStart(8, '0');
            backupCodes.push(code);
            records.push({ userId: user.id, codeHash: await (0, argon2_1.hash)(code) });
        }
        await this.prisma.backupCode.createMany({ data: records });
        const totp = new otpauth.TOTP({
            issuer: 'BRUNY SHOPPING',
            label: user.email ?? user.phone ?? user.id,
            secret,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
        });
        return { secret: secret.base32, otpauthUrl: totp.toString(), backupCodes };
    }
    async verifyTwoFactor(challengeToken, code, req, res) {
        const userId = await this.requireChallengeUser(challengeToken, null);
        const record = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
        });
        if (!record || !record.twoFactorSecret || record.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException({ code: 'TWO_FACTOR_REQUIRED' });
        }
        const codeOk = code.length === 6
            ? this.verifyTotp(record.twoFactorSecret, code)
            : await this.verifyBackupCode(record.id, code);
        if (!codeOk) {
            throw new common_1.UnauthorizedException({ code: 'TWO_FACTOR_INVALID' });
        }
        return this.issueSession(record.id, record.roles.map((entry) => entry.role.name), req, res);
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
        });
        if (!user) {
            throw new common_1.UnauthorizedException({ code: 'UNAUTHENTICATED' });
        }
        return this.toProfile(user, user.roles.map((entry) => entry.role.name));
    }
    // -------------------------------------------------------------------------
    // Internals
    // -------------------------------------------------------------------------
    async issueSession(userId, roles, req, res) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const accessToken = await this.signAccess(user.id, user.email, roles);
        await this.createRefreshToken(userId, (0, node_crypto_1.randomUUID)(), req, res);
        return {
            accessToken,
            user: this.toProfile(user, roles),
        };
    }
    async signAccess(userId, email, roles) {
        const payload = {
            sub: userId,
            email: email ?? '',
            roles,
            typ: 'access',
        };
        return this.jwt.signAsync(payload, {
            expiresIn: (0, duration_1.parseDuration)(this.authConfig().accessTtl),
        });
    }
    async signChallenge(userId, purpose) {
        return this.jwt.signAsync({ sub: userId, typ: '2fa', purpose }, { expiresIn: (0, duration_1.parseDuration)(CHALLENGE_TTL) });
    }
    async requireChallengeUser(challengeToken, expectedPurpose) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(challengeToken);
        }
        catch {
            throw new common_1.UnauthorizedException({ code: 'INVALID_TOKEN' });
        }
        if (payload.typ !== '2fa') {
            throw new common_1.UnauthorizedException({ code: 'INVALID_TOKEN' });
        }
        // 'setup' tokens only open the setup endpoint; once the secret is stored
        // the same challenge token completes the login via /2fa/verify.
        if (expectedPurpose === 'setup' && payload.purpose !== 'setup') {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN' });
        }
        return payload.sub;
    }
    async createRefreshToken(userId, familyId, req, res) {
        const token = (0, crypto_1.randomToken)(32);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                familyId,
                tokenHash: (0, crypto_1.sha256hex)(token),
                expiresAt: new Date(Date.now() + (0, duration_1.parseDuration)(this.authConfig().refreshTtl)),
                userAgent: (req.headers['user-agent'] ?? '').slice(0, 255) || null,
                ip: req.ip ?? null,
            },
        });
        this.setRefreshCookie(res, token);
    }
    setRefreshCookie(res, token) {
        const auth = this.authConfig();
        res.cookie(exports.REFRESH_COOKIE_NAME, token, {
            httpOnly: true,
            secure: auth.cookieSecure,
            sameSite: 'lax',
            path: '/api/v1/auth',
            maxAge: (0, duration_1.parseDuration)(auth.refreshTtl),
            domain: auth.cookieDomain || undefined,
        });
    }
    clearRefreshCookie(res) {
        const auth = this.authConfig();
        res.clearCookie(exports.REFRESH_COOKIE_NAME, {
            httpOnly: true,
            secure: auth.cookieSecure,
            sameSite: 'lax',
            path: '/api/v1/auth',
            domain: auth.cookieDomain || undefined,
        });
    }
    authConfig() {
        const app = this.config.get('app');
        if (!app) {
            throw new Error('Application configuration missing');
        }
        return app.auth;
    }
    jwtSecret() {
        return this.authConfig().secret;
    }
    // --- Lockout (BOA-01) ----------------------------------------------------
    async assertNotLockedOut(lookup) {
        const attempts = Number((await this.redisService.redis.get(this.lockKey(lookup))) ?? 0);
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            throw new common_1.UnauthorizedException({ code: 'TOO_MANY_ATTEMPTS' });
        }
    }
    async recordFailedAttempt(lookup) {
        const key = this.lockKey(lookup);
        const attempts = await this.redisService.redis.incr(key);
        if (attempts === 1) {
            await this.redisService.redis.expire(key, LOCKOUT_TTL_SECONDS);
        }
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            this.logger.warn(`login lockout engaged for ${this.maskIdentifier(lookup)}`);
        }
    }
    async clearFailures(lookup) {
        await this.redisService.redis.del(this.lockKey(lookup));
    }
    lockKey(identifier) {
        return `${LOCK_KEY_PREFIX}${(0, crypto_1.sha256hex)(identifier)}`;
    }
    maskIdentifier(identifier) {
        const email = identifier.split('@');
        if (email.length === 2)
            return `${email[0]?.slice(0, 1) ?? '*'}***@${email[1]}`;
        return `***${identifier.slice(-2)}`;
    }
    async verifyAgainstDummy(password) {
        this.dummyHash ??= await (0, argon2_1.hash)((0, crypto_1.randomToken)(32));
        return (0, argon2_1.verify)(this.dummyHash, password);
    }
    // --- 2FA internals --------------------------------------------------------
    verifyTotp(encryptedSecret, code) {
        try {
            const plain = (0, crypto_1.decryptSecret)(encryptedSecret, this.jwtSecret());
            const totp = new otpauth.TOTP({
                secret: otpauth.Secret.fromBase32(plain),
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
            });
            return totp.validate({ token: code, window: 1 }) !== null;
        }
        catch (error) {
            this.logger.error(`TOTP verification error: ${String(error)}`);
            return false;
        }
    }
    async verifyBackupCode(userId, code) {
        const codes = await this.prisma.backupCode.findMany({
            where: { userId, usedAt: null },
        });
        for (const record of codes) {
            if (await (0, argon2_1.verify)(record.codeHash, code)) {
                await this.prisma.backupCode.update({
                    where: { id: record.id },
                    data: { usedAt: new Date() },
                });
                return true;
            }
        }
        return false;
    }
    toProfile(user, roles) {
        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
            roles,
            twoFactorEnabled: user.twoFactorSecret !== null,
            createdAt: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_module_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        cache_module_1.RedisService,
        mail_service_1.MailService])
], AuthService);

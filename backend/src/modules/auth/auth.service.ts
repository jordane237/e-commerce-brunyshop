import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify as verifyHash } from '@node-rs/argon2';
import { randomInt, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import * as otpauth from 'otpauth';

import type { ApplicationConfig } from '../../config/configuration';
import { PrismaService } from '../../infrastructure/database/database.module';
import { MailService } from '../../infrastructure/mail/mail.service';
import { RedisService } from '../../infrastructure/cache/cache.module';
import { parseDuration } from '../../common/utils/duration';
import { decryptSecret, encryptSecret, randomToken, sha256hex } from '../../common/utils/crypto';
import { assertPasswordStrength } from '../../common/utils/password';
import type { AccessTokenPayload } from '../../common/guards/jwt-auth.guard';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { ResetPasswordDto } from './dto/password.dto';

export const REFRESH_COOKIE_NAME = 'bruny_refresh';

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

export interface PublicProfile {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  twoFactorEnabled: boolean;
  createdAt: Date;
}

interface AuthResult {
  accessToken: string;
  user: PublicProfile;
}

interface ChallengeResult {
  twoFactorRequired: true;
  setupRequired?: true;
  challengeToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    private readonly mail: MailService,
  ) {}

  // -------------------------------------------------------------------------
  // Registration / login
  // -------------------------------------------------------------------------

  async register(dto: RegisterDto, req: Request, res: Response): Promise<AuthResult> {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();
    if (!email && !phone) {
      throw new BadRequestException({
        code: 'MISSING_IDENTIFIER',
        message: 'Renseignez un email ou un téléphone.',
      });
    }
    assertPasswordStrength(dto.password);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({ code: 'ACCOUNT_EXISTS' });
    }

    const user = await this.prisma.user.create({
      data: {
        email: email ?? null,
        phone: phone ?? null,
        passwordHash: await hash(dto.password),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
      },
    });

    this.logger.log(`account created: ${user.id}`);
    return this.issueSession(user.id, [], req, res);
  }

  async login(dto: LoginDto, req: Request, res: Response): Promise<AuthResult | ChallengeResult> {
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
      ? await verifyHash(user.passwordHash, dto.password)
      : await this.verifyAgainstDummy(dto.password);

    if (!user || !passwordOk || user.status !== 'ACTIVE') {
      await this.recordFailedAttempt(lookup);
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
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

  async refresh(req: Request, res: Response): Promise<{ accessToken: string }> {
    const cookie = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    if (!cookie) {
      throw new UnauthorizedException({ code: 'NO_SESSION' });
    }
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256hex(cookie) },
    });
    if (!record) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({ code: 'INVALID_SESSION' });
    }
    if (record.revokedAt) {
      // Reuse of a rotated token: revoke the whole family (cachier §10.2).
      await this.prisma.refreshToken.updateMany({
        where: { familyId: record.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.clearRefreshCookie(res);
      this.logger.warn(`refresh token reuse detected — family ${record.familyId} revoked`);
      throw new UnauthorizedException({ code: 'SESSION_REUSE_DETECTED' });
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({ code: 'SESSION_EXPIRED' });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({ code: 'INVALID_SESSION' });
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

  async logout(req: Request, res: Response): Promise<{ ok: true }> {
    const cookie = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    if (cookie) {
      const record = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: sha256hex(cookie) },
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

  async forgotPassword(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      return; // identical 202 response either way
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.redisService.redis.set(
      `${RESET_KEY_PREFIX}${sha256hex(normalized)}`,
      sha256hex(code),
      'EX',
      RESET_TTL_SECONDS,
    );
    try {
      await this.mail.sendPasswordResetCode(normalized, code);
    } catch {
      // Never let transport failures reveal account existence.
      this.logger.error('reset mail delivery failed');
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    const email = dto.email.trim().toLowerCase();
    assertPasswordStrength(dto.newPassword);

    const stored = await this.redisService.redis.getdel(`${RESET_KEY_PREFIX}${sha256hex(email)}`);
    if (!stored || stored !== sha256hex(dto.code)) {
      throw new BadRequestException({ code: 'INVALID_CODE' });
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      throw new BadRequestException({ code: 'INVALID_CODE' });
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(dto.newPassword) },
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

  async setupTwoFactor(challengeToken: string): Promise<{
    secret: string;
    otpauthUrl: string;
    backupCodes: string[];
  }> {
    const userId = await this.requireChallengeUser(challengeToken, 'setup');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }
    const roles = user.roles.map((entry) => entry.role.name);
    if (!roles.some((role) => PRIVILEGED_ROLES.includes(role))) {
      throw new ForbiddenException({ code: 'FORBIDDEN' });
    }

    const secret = new otpauth.Secret({ size: 20 });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: encryptSecret(secret.base32, this.jwtSecret()) },
    });

    // Backup codes: 8 digits, hashed at rest, single use (BOA-04).
    await this.prisma.backupCode.deleteMany({ where: { userId: user.id } });
    const backupCodes: string[] = [];
    const records: Array<{ userId: string; codeHash: string }> = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i += 1) {
      const code = String(randomInt(0, 100_000_000)).padStart(8, '0');
      backupCodes.push(code);
      records.push({ userId: user.id, codeHash: await hash(code) });
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

  async verifyTwoFactor(
    challengeToken: string,
    code: string,
    req: Request,
    res: Response,
  ): Promise<AuthResult> {
    const userId = await this.requireChallengeUser(challengeToken, null);
    const record = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!record || !record.twoFactorSecret || record.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'TWO_FACTOR_REQUIRED' });
    }

    const codeOk =
      code.length === 6
        ? this.verifyTotp(record.twoFactorSecret, code)
        : await this.verifyBackupCode(record.id, code);
    if (!codeOk) {
      throw new UnauthorizedException({ code: 'TWO_FACTOR_INVALID' });
    }

    return this.issueSession(
      record.id,
      record.roles.map((entry) => entry.role.name),
      req,
      res,
    );
  }

  async getProfile(userId: string): Promise<PublicProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }
    return this.toProfile(
      user,
      user.roles.map((entry) => entry.role.name),
    );
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async issueSession(
    userId: string,
    roles: string[],
    req: Request,
    res: Response,
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const accessToken = await this.signAccess(user.id, user.email, roles);
    await this.createRefreshToken(userId, randomUUID(), req, res);
    return {
      accessToken,
      user: this.toProfile(user, roles),
    };
  }

  private async signAccess(userId: string, email: string | null, roles: string[]): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
      email: email ?? '',
      roles,
      typ: 'access',
    };
    return this.jwt.signAsync(payload, {
      expiresIn: parseDuration(this.authConfig().accessTtl),
    });
  }

  private async signChallenge(userId: string, purpose: 'setup' | 'verify') {
    return this.jwt.signAsync(
      { sub: userId, typ: '2fa', purpose },
      { expiresIn: parseDuration(CHALLENGE_TTL) },
    );
  }

  private async requireChallengeUser(
    challengeToken: string,
    expectedPurpose: 'setup' | 'verify' | null,
  ): Promise<string> {
    type ChallengePayload = { sub: string; typ: string; purpose?: string };
    let payload: ChallengePayload;
    try {
      payload = await this.jwt.verifyAsync<ChallengePayload>(challengeToken);
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }
    if (payload.typ !== '2fa') {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }
    // 'setup' tokens only open the setup endpoint; once the secret is stored
    // the same challenge token completes the login via /2fa/verify.
    if (expectedPurpose === 'setup' && payload.purpose !== 'setup') {
      throw new ForbiddenException({ code: 'FORBIDDEN' });
    }
    return payload.sub;
  }

  private async createRefreshToken(
    userId: string,
    familyId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const token = randomToken(32);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: sha256hex(token),
        expiresAt: new Date(Date.now() + parseDuration(this.authConfig().refreshTtl)),
        userAgent: (req.headers['user-agent'] ?? '').slice(0, 255) || null,
        ip: req.ip ?? null,
      },
    });
    this.setRefreshCookie(res, token);
  }

  private setRefreshCookie(res: Response, token: string): void {
    const auth = this.authConfig();
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: auth.cookieSecure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: parseDuration(auth.refreshTtl),
      domain: auth.cookieDomain || undefined,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const auth = this.authConfig();
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: auth.cookieSecure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      domain: auth.cookieDomain || undefined,
    });
  }

  private authConfig(): ApplicationConfig['auth'] {
    const app = this.config.get<ApplicationConfig>('app');
    if (!app) {
      throw new Error('Application configuration missing');
    }
    return app.auth;
  }

  private jwtSecret(): string {
    return this.authConfig().secret;
  }

  // --- Lockout (BOA-01) ----------------------------------------------------

  private async assertNotLockedOut(lookup: string): Promise<void> {
    const attempts = Number((await this.redisService.redis.get(this.lockKey(lookup))) ?? 0);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      throw new UnauthorizedException({ code: 'TOO_MANY_ATTEMPTS' });
    }
  }

  private async recordFailedAttempt(lookup: string): Promise<void> {
    const key = this.lockKey(lookup);
    const attempts = await this.redisService.redis.incr(key);
    if (attempts === 1) {
      await this.redisService.redis.expire(key, LOCKOUT_TTL_SECONDS);
    }
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      this.logger.warn(`login lockout engaged for ${this.maskIdentifier(lookup)}`);
    }
  }

  private async clearFailures(lookup: string): Promise<void> {
    await this.redisService.redis.del(this.lockKey(lookup));
  }

  private lockKey(identifier: string): string {
    return `${LOCK_KEY_PREFIX}${sha256hex(identifier)}`;
  }

  private maskIdentifier(identifier: string): string {
    const email = identifier.split('@');
    if (email.length === 2) return `${email[0]?.slice(0, 1) ?? '*'}***@${email[1]}`;
    return `***${identifier.slice(-2)}`;
  }

  private async verifyAgainstDummy(password: string): Promise<boolean> {
    this.dummyHash ??= await hash(randomToken(32));
    return verifyHash(this.dummyHash, password);
  }

  // --- 2FA internals --------------------------------------------------------

  private verifyTotp(encryptedSecret: string, code: string): boolean {
    try {
      const plain = decryptSecret(encryptedSecret, this.jwtSecret());
      const totp = new otpauth.TOTP({
        secret: otpauth.Secret.fromBase32(plain),
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });
      return totp.validate({ token: code, window: 1 }) !== null;
    } catch (error) {
      this.logger.error(`TOTP verification error: ${String(error)}`);
      return false;
    }
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const codes = await this.prisma.backupCode.findMany({
      where: { userId, usedAt: null },
    });
    for (const record of codes) {
      if (await verifyHash(record.codeHash, code)) {
        await this.prisma.backupCode.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }

  private toProfile(
    user: {
      id: string;
      email: string | null;
      phone: string | null;
      firstName: string;
      lastName: string;
      status: string;
      twoFactorSecret: string | null;
      createdAt: Date;
    },
    roles: string[],
  ): PublicProfile {
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
}

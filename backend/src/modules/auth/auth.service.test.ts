import type { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from '@node-rs/argon2';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { ApplicationConfig } from '../../config/configuration';
import type { RedisService } from '../../infrastructure/cache/cache.module';
import type { PrismaService } from '../../infrastructure/database/database.module';
import type { MailService } from '../../infrastructure/mail/mail.service';
import { AuthService, REFRESH_COOKIE_NAME } from './auth.service';
import type { LoginDto } from './dto/login.dto';

const JWT_SECRET = 'unit-test-secret-unit-test-secret-unit-test';

const appConfig = {
  environment: 'development',
  port: 4000,
  databaseUrl: 'postgres://test',
  redisUrl: 'redis://test',
  publicAppUrl: 'http://localhost:4000',
  publicAdminUrl: 'http://localhost:4200',
  corsOrigins: ['http://localhost:4200'],
  throttle: { ttlSeconds: 60, limit: 100 },
  auth: {
    secret: JWT_SECRET,
    accessTtl: '15m',
    refreshTtl: '30d',
    cookieSecure: false,
  },
  isProduction: false,
} as unknown as ApplicationConfig;

function makeService() {
  const redisOps = {
    get: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(1),
    set: vi.fn().mockResolvedValue('OK'),
    getdel: vi.fn().mockResolvedValue(null),
  };
  const prisma = {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    backupCode: { deleteMany: vi.fn(), createMany: vi.fn(), findMany: vi.fn() },
  };
  const mail = { sendPasswordResetCode: vi.fn().mockResolvedValue(undefined) };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    new JwtService({ secret: JWT_SECRET }),
    { get: vi.fn().mockReturnValue(appConfig) } as unknown as ConfigService,
    { redis: redisOps } as unknown as RedisService,
    mail as unknown as MailService,
  );
  return { service, redisOps, prisma, mail };
}

const request = {
  headers: { 'user-agent': 'vitest' },
  cookies: {},
  ip: '127.0.0.1',
} as unknown as Request;

function makeResponse() {
  return { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
}

describe('AuthService', () => {
  it('verrouille après 5 échecs avant même de chercher le compte (BOA-01)', async () => {
    const { service, redisOps, prisma } = makeService();
    redisOps.get.mockResolvedValue('5');

    const dto: LoginDto = { identifier: 'cible@exemple.cm', password: 'x' };

    try {
      await service.login(dto, request, makeResponse());
      expect.unreachable('login must throw when locked out');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toMatchObject({
        code: 'TOO_MANY_ATTEMPTS',
      });
    }
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("répond 401 générique et compte l'échec pour un identifiant inconnu", async () => {
    const { service, redisOps, prisma } = makeService();
    prisma.user.findFirst.mockResolvedValue(null);

    try {
      await service.login(
        { identifier: 'inconnu@exemple.cm', password: 'Whatever!23' },
        request,
        makeResponse(),
      );
      expect.unreachable('login must fail');
    } catch (error) {
      expect((error as UnauthorizedException).getResponse()).toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
    }
    expect(redisOps.incr).toHaveBeenCalledTimes(1);
    expect(redisOps.expire).toHaveBeenCalledWith(
      expect.stringContaining('auth:lock:'),
      expect.any(Number),
    );
  });

  it('réussit une connexion client et pose le cookie de rafraîchissement', async () => {
    const { service, redisOps, prisma } = makeService();
    const password = 'Client!Secret99';
    const userRow = {
      id: 'user-1',
      email: 'client@exemple.cm',
      phone: null,
      firstName: 'Cline',
      lastName: 'Test',
      status: 'ACTIVE',
      twoFactorSecret: null,
      passwordHash: await hash(password),
      createdAt: new Date(),
    };
    prisma.user.findFirst.mockResolvedValue({
      ...userRow,
      roles: [],
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue(userRow);
    prisma.refreshToken.create.mockResolvedValue({});

    const res = makeResponse();
    const result = await service.login({ identifier: 'client@exemple.cm', password }, request, res);

    expect(result).toHaveProperty('accessToken');
    expect('twoFactorRequired' in result).toBe(false);
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(redisOps.del).toHaveBeenCalledTimes(1);
  });

  it("forgotPassword : réponse neutre et pas d'envoi si le compte est absent", async () => {
    const { service, redisOps, prisma, mail } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);

    await service.forgotPassword('absent@exemple.cm');

    expect(redisOps.set).not.toHaveBeenCalled();
    expect(mail.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('forgotPassword : code haché avec EX 15 min et mail envoyé si compte présent', async () => {
    const { service, redisOps, prisma, mail } = makeService();
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', deletedAt: null });

    await service.forgotPassword('client@exemple.cm');

    expect(redisOps.set).toHaveBeenCalledWith(
      'auth:reset:client@exemple.cm',
      expect.stringMatching(/^[0-9a-f]{64}$/),
      'EX',
      900,
    );
    expect(mail.sendPasswordResetCode).toHaveBeenCalledWith(
      'client@exemple.cm',
      expect.stringMatching(/^[0-9]{6}$/),
    );
  });
});

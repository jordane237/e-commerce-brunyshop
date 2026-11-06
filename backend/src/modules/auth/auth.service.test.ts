import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

import type { ApplicationConfig } from '../../config/configuration';
import type { RedisService } from '../../infrastructure/cache/cache.module';
import type { PrismaService } from '../../infrastructure/database/database.module';
import type { MailService } from '../../infrastructure/mail/mail.service';
import { AuthService, maskEmail, maskPhone } from './auth.service';
import type { RegisterDto } from './dto/register.dto';

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

function makeRegisterDto(overrides: Partial<RegisterDto> = {}): RegisterDto {
  return {
    email: overrides.email ?? 'client@example.cm',
    phone: overrides.phone ?? null,
    password: overrides.password ?? 'SuperSecurePassword123',
    firstName: overrides.firstName ?? 'Jean',
    lastName: overrides.lastName ?? 'Dupont',
    termsAccepted: overrides.termsAccepted ?? true,
    termsVersion: overrides.termsVersion ?? '1.0',
  } as RegisterDto;
}

function makeService() {
  const redisOps = {
    get: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(1),
    set: vi.fn().mockResolvedValue('OK'),
  };
  const prisma = {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      $transaction: vi.fn(
        async (fn) =>
          await fn({
            user: {
              create: vi.fn(async (data) => ({ id: 'user-123', ...data })),
            },
            role: {
              findFirst: vi.fn(async () => ({ id: 'role-456' })),
            },
            userRole: {
              create: vi.fn().mockResolvedValue({}),
            },
          }),
      ),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    backupCode: { deleteMany: vi.fn(), createMany: vi.fn(), findMany: vi.fn() },
    twoFactorSecret: { create: vi.fn(), findUnique: vi.fn(), deleteMany: vi.fn() },
    setting: { findUnique: vi.fn().mockResolvedValue({ key: 'terms.version', value: '1.0' }) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    new JwtService({ secret: JWT_SECRET }),
    { get: vi.fn().mockReturnValue(appConfig) } as unknown as ConfigService,
    { redis: redisOps } as unknown as RedisService,
    { sendPasswordResetCode: vi.fn().mockResolvedValue(undefined) } as unknown as MailService,
    { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditLogService,
  );
  return { service, redisOps, prisma, mail };
}

const request = {
  headers: { 'user-agent': 'vitest', 'x-forwarded-for': '127.0.0.1' },
  cookies: {},
  ip: '127.0.0.1',
} as unknown as Request;

function makeResponse() {
  return { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
}

describe('AuthService - Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create user with valid data and return RegisterResponseDto', async () => {
    const { service, prisma } = makeService();
    const dto = makeRegisterDto();
    const response = await service.register(dto, request, makeResponse());

    expect(prisma.user.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.$transaction).toHaveBeenCalledWith(expect.any(Function));
    const transactionFn = prisma.user.$transaction.mock.calls[0][0];
    const { created } = (await transactionFn({
      user: { create: vi.fn().mockResolvedValue({ id: 'new-user-id', createdAt: new Date() }) },
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(created).toBeDefined();
    expect(created.passwordHash).not.toBeUndefined();
    expect(response).toEqual({
      message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
      id: 'new-user-id',
      emailMasked: 'c***@example.cm',
      phoneMasked: null,
      status: 'PENDING_VERIFICATION',
      createdAt: expect.any(Date),
    });
  });

  it('should reject weak password', async () => {
    const { service } = makeService();
    const dto = makeRegisterDto({ password: 'password' });
    await expect(service.register(dto, request, makeResponse())).rejects.toThrow(
      'Ce mot de passe est trop courant. Choisissez un mot de passe plus fort.',
    );
    expect(prisma.user.$transaction).not.toHaveBeenCalled();
  });

  it('should reject when email and phone are both missing', async () => {
    const { service } = makeService();
    const dto = makeRegisterDto({ email: undefined, phone: undefined });
    await expect(service.register(dto, request, makeResponse())).rejects.toThrow(
      'Renseignez un email ou un téléphone.',
    );
    expect(prisma.user.$transaction).not.toHaveBeenCalled();
  });

  it('should reject when terms not accepted', async () => {
    const { service } = makeService();
    const dto = makeRegisterDto({ termsAccepted: false });
    await expect(service.register(dto, request, makeResponse())).rejects.toThrow(
      'Vous devez accepter les CGV pour créer un compte.',
    );
    expect(prisma.user.$transaction).not.toHaveBeenCalled();
  });

  it('should reject when terms version mismatch', async () => {
    const { service, prisma } = makeService();
    prisma.setting.findUnique.mockResolvedValue({ key: 'terms.version', value: '2.0' });
    const dto = makeRegisterDto({ termsVersion: '0.9' });
    await expect(service.register(dto, request, makeResponse())).rejects.toThrow(
      'La version des CGV a changé, merci de recharger la page et de réaccepter.',
    );
    expect(prisma.user.$transaction).not.toHaveBeenCalled();
  });

  it('should create user when data is valid (happy path)', async () => {
    const { service, prisma } = makeService();
    const dto = makeRegisterDto();
    const response = await service.register(dto, request, makeResponse());
    expect(response.message).toContain('succès');
    expect(response.status).toBe('PENDING_VERIFICATION');
    expect(response.emailMasked).toBe('c***@example.cm');
    expect(prisma.user.$transaction).toHaveBeenCalled();
  });

  it('should return neutral response on duplicate (silent)', async () => {
    const { service, prisma } = makeService();
    prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });
    const dto = makeRegisterDto();
    const response = await service.register(dto, request, makeResponse());
    expect(response.id).toBeDefined();
    expect(response.id).not.toBe('user-123');
    expect(response.emailMasked).toBe('c***@example.cm');
    expect(response.message).toContain('compte créé');
    expect(prisma.user.$transaction).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_REGISTERED_DUPLICATE' }),
    );
  });
});

describe('AuthService - Helpers', () => {
  it('maskEmail should mask email locally', () => {
    expect(maskEmail('client@example.cm')).toBe('c***@example.cm');
    expect(maskEmail(null)).toBeNull();
  });

  it('maskPhone should mask phone', () => {
    expect(maskPhone('+237612345678')).toBe('***5678');
    expect(maskPhone(null)).toBeNull();
  });
});

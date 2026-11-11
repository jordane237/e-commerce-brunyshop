import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';

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
    email: 'email' in overrides ? overrides.email : 'client@example.cm',
    phone: 'phone' in overrides ? overrides.phone : null,
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

  const createdUser = {
    id: 'new-user-id',
    email: 'client@example.cm',
    phone: null,
    firstName: 'Jean',
    lastName: 'Dupont',
    status: 'PENDING_VERIFICATION',
    createdAt: new Date('2026-11-05T10:30:00.000Z'),
  };
  const user = {
    create: vi.fn().mockResolvedValue(createdUser),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const role = { findFirst: vi.fn().mockResolvedValue({ id: 'role-customer' }) };
  const userRole = { create: vi.fn().mockResolvedValue({}) };
  const prisma = {
    user,
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({ user, role, userRole })),
    setting: {
      findUnique: vi.fn().mockResolvedValue({ key: 'terms.version', value: '1.0' }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
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
  return { service, redisOps, prisma, mail, user, role, userRole, createdUser };
}

const request = {
  headers: { 'user-agent': 'vitest', 'x-forwarded-for': '127.0.0.1' },
  cookies: {},
  ip: '127.0.0.1',
} as unknown as Request;

describe('AuthService — Inscription (AUT-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crée le compte avec un rôle CUSTOMER, le consentement CGV et une réponse neutre', async () => {
    const { service, user, role, userRole, createdUser } = makeService();

    const response = await service.register(makeRegisterDto(), request);

    expect(user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'client@example.cm',
        phone: null,
        status: 'PENDING_VERIFICATION',
        termsVersion: '1.0',
        termsAcceptedAt: expect.any(Date),
      }),
    });
    expect(role.findFirst).toHaveBeenCalledWith({
      where: { name: 'CUSTOMER' },
      select: { id: true },
    });
    expect(userRole.create).toHaveBeenCalledWith({
      data: { userId: createdUser.id, roleId: 'role-customer' },
    });
    expect(response).toEqual({
      id: 'new-user-id',
      emailMasked: 'c***@example.cm',
      phoneMasked: null,
      firstName: 'Jean',
      lastName: 'Dupont',
      status: 'PENDING_VERIFICATION',
      createdAt: createdUser.createdAt,
      message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
    });
    // Aucun jeton n'est émis à l'inscription (AUT-02 s'en charge).
    expect(response).not.toHaveProperty('accessToken');
  });

  it('refuse un mot de passe courant', async () => {
    const { service, user } = makeService();
    await expect(
      service.register(makeRegisterDto({ password: 'password123' }), request),
    ).rejects.toThrow(BadRequestException);
    expect(user.create).not.toHaveBeenCalled();
  });

  it('refuse quand ni e-mail ni téléphone ne sont fournis', async () => {
    const { service, user } = makeService();
    await expect(
      service.register(makeRegisterDto({ email: undefined, phone: undefined }), request),
    ).rejects.toMatchObject({ response: { code: 'MISSING_IDENTIFIER' } });
    expect(user.create).not.toHaveBeenCalled();
  });

  it('refuse quand les CGV ne sont pas acceptées', async () => {
    const { service, user } = makeService();
    await expect(
      service.register(makeRegisterDto({ termsAccepted: false }), request),
    ).rejects.toMatchObject({ response: { code: 'TERMS_NOT_ACCEPTED' } });
    expect(user.create).not.toHaveBeenCalled();
  });

  it('refuse une version des CGV obsolète', async () => {
    const { service, prisma, user } = makeService();
    prisma.setting.findUnique.mockResolvedValue({ key: 'terms.version', value: '2.0' });
    await expect(
      service.register(makeRegisterDto({ termsVersion: '1.0' }), request),
    ).rejects.toMatchObject({ response: { code: 'TERMS_VERSION_MISMATCH' } });
    expect(user.create).not.toHaveBeenCalled();
  });

  it('répond de façon neutre sur un doublon, sans créer de compte, et journalise', async () => {
    const { service, prisma, user } = makeService();
    user.findFirst.mockResolvedValue({ id: 'existing-user-id' });

    const response = await service.register(makeRegisterDto(), request);

    expect(user.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'existing-user-id',
        action: 'USER_REGISTERED_DUPLICATE',
        entity: 'User',
      }),
    });
    // Même structure que la réponse de création, identifiant opaque différent.
    expect(response.id).not.toBe('existing-user-id');
    expect(response.emailMasked).toBe('c***@example.cm');
    expect(response.message).toBe(
      'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
    );
  });
});

describe('AuthService — Masquage des identifiants', () => {
  it('masque un e-mail en gardant le domaine', () => {
    expect(maskEmail('client@example.cm')).toBe('c***@example.cm');
    expect(maskEmail(null)).toBeNull();
  });

  it('masque un téléphone en gardant les 4 derniers chiffres', () => {
    expect(maskPhone('+237612345678')).toBe('***5678');
    expect(maskPhone(null)).toBeNull();
  });
});

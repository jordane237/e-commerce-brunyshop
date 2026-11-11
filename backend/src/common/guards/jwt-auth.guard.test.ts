import 'reflect-metadata';

import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { PrismaService } from '../../infrastructure/database/database.module';
import { JwtAuthGuard, type AccessTokenPayload } from './jwt-auth.guard';

interface TestUser {
  id: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING_VERIFICATION';
  twoFactorSecret: string | null;
  deletedAt: Date | null;
  roles: Array<{ role: { name: string } }>;
}

const activeUser: TestUser = {
  id: 'u1',
  email: 'awa@bruny.test',
  phone: null,
  status: 'ACTIVE',
  twoFactorSecret: null,
  deletedAt: null,
  roles: [{ role: { name: 'ADMIN' } }],
};

const payload: AccessTokenPayload = {
  sub: 'u1',
  email: 'awa@bruny.test',
  roles: ['ADMIN'],
  typ: 'access',
};

function contextFor(authorization?: string, handler?: (...args: unknown[]) => unknown) {
  const headers: Record<string, string> = {};
  if (authorization) headers.authorization = authorization;
  const request = { headers } as unknown as Request & { user?: AuthenticatedUser };
  return {
    context: {
      getHandler: () => handler ?? ((): void => undefined),
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext,
    request,
  };
}

function makeGuard(
  verify: (token: string) => Promise<AccessTokenPayload>,
  user: TestUser | null = activeUser,
) {
  const verifyAsync = vi.fn(verify);
  const findUnique = vi.fn().mockResolvedValue(user);
  const guard = new JwtAuthGuard({ verifyAsync } as unknown as JwtService, new Reflector(), {
    user: { findUnique },
  } as unknown as PrismaService);
  return { guard, verifyAsync, findUnique };
}

async function expectCode(promise: Promise<boolean>, code: string): Promise<void> {
  try {
    await promise;
    throw new Error(`expected UnauthorizedException ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).getResponse()).toMatchObject({ code });
  }
}

describe('JwtAuthGuard', () => {
  it('refuse une requête sans jeton (401 UNAUTHORIZED)', async () => {
    const { guard, findUnique } = makeGuard(async () => payload);
    const { context } = contextFor();
    await expectCode(guard.canActivate(context), 'UNAUTHORIZED');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('refuse un header malformé (401 UNAUTHORIZED)', async () => {
    const { guard } = makeGuard(async () => payload);
    const { context } = contextFor('Token abc');
    await expectCode(guard.canActivate(context), 'UNAUTHORIZED');
  });

  it('refuse une signature invalide (401 INVALID_TOKEN)', async () => {
    const { guard } = makeGuard(async () => {
      throw new Error('invalid signature');
    });
    const { context } = contextFor('Bearer bad-token');
    await expectCode(guard.canActivate(context), 'INVALID_TOKEN');
  });

  it('distingue un jeton expiré (401 TOKEN_EXPIRED)', async () => {
    const { guard } = makeGuard(async () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      throw error;
    });
    const { context } = contextFor('Bearer expired-token');
    await expectCode(guard.canActivate(context), 'TOKEN_EXPIRED');
  });

  it('refuse un jeton qui n’est pas un access token', async () => {
    const { guard, findUnique } = makeGuard(async () => ({
      ...payload,
      typ: '2fa' as unknown as 'access',
    }));
    const { context } = contextFor('Bearer challenge-token');
    await expectCode(guard.canActivate(context), 'INVALID_TOKEN');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('accepte un jeton valide et recharge les rôles en base', async () => {
    const { guard, verifyAsync, findUnique } = makeGuard(async () => payload);
    const { context, request } = contextFor('Bearer valid-token');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      include: { roles: { include: { role: true } } },
    });
    expect(request.user).toMatchObject({ id: 'u1', roles: ['ADMIN'] });
  });

  it('bypasse la vérification pour une route @Public', async () => {
    const { guard, verifyAsync, findUnique } = makeGuard(async () => payload);
    const handler = (): void => undefined;
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
    const { context } = contextFor(undefined, handler);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAsync).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('refuse un compte suspendu même avec un jeton valide', async () => {
    const { guard } = makeGuard(async () => payload, { ...activeUser, status: 'SUSPENDED' });
    const { context } = contextFor('Bearer valid-token');
    await expectCode(guard.canActivate(context), 'INVALID_TOKEN');
  });

  it('refuse un compte supprimé logiquement', async () => {
    const { guard } = makeGuard(async () => payload, { ...activeUser, deletedAt: new Date() });
    const { context } = contextFor('Bearer valid-token');
    await expectCode(guard.canActivate(context), 'INVALID_TOKEN');
  });

  it('refuse un utilisateur introuvable', async () => {
    const { guard } = makeGuard(async () => payload, null);
    const { context } = contextFor('Bearer valid-token');
    await expectCode(guard.canActivate(context), 'INVALID_TOKEN');
  });
});

import 'reflect-metadata';

import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { ROLES_KEY, Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function contextFor(
  handler: (...args: unknown[]) => unknown,
  user?: AuthenticatedUser,
): ExecutionContext {
  const request: Request & { user?: AuthenticatedUser } = Object.create(
    Request.prototype,
  ) as unknown as Request & { user?: AuthenticatedUser };
  request.user = user;
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function userWithRoles(...roles: string[]): AuthenticatedUser {
  return {
    id: 'u1',
    email: 'x@y.z',
    phone: null,
    roles,
    twoFactorEnabled: false,
  };
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('laisse passer les routes sans @Roles (tout utilisateur connecté)', () => {
    const handler = (): void => undefined;
    expect(guard.canActivate(contextFor(handler, userWithRoles()))).toBe(true);
  });

  it('accepte un rôle autorisé par la matrice §2', () => {
    const handler = (): void => undefined;
    Roles('STOCK_MANAGER')(handler, undefined as never);
    expect(guard.canActivate(contextFor(handler, userWithRoles('STOCK_MANAGER')))).toBe(true);
  });

  it('refuse un rôle absent (403)', () => {
    const handler = (): void => undefined;
    Roles('ADMIN')(handler, undefined as never);
    expect(() => guard.canActivate(contextFor(handler, userWithRoles('LIVREUR')))).toThrow(
      ForbiddenException,
    );
  });

  it('accepte un rôle avec un handler partagé', () => {
    const handler = (): void => undefined;
    Roles('ADMIN')(handler, undefined as never);
    expect(guard.canActivate(contextFor(handler, userWithRoles('ADMIN')))).toBe(true);
  });

  it('SUPER_ADMIN ouvre toutes les portes (cachier §2)', () => {
    const handler = (): void => undefined;
    Roles('STOCK_MANAGER')(handler, undefined as never);
    expect(guard.canActivate(contextFor(handler, userWithRoles('SUPER_ADMIN')))).toBe(true);
  });

  it("401 si aucune identité alors qu'un rôle est exigé", () => {
    const handler = (): void => undefined;
    Roles('ADMIN')(handler, undefined as never);
    expect(() => guard.canActivate(contextFor(handler, undefined))).toThrow(UnauthorizedException);
  });

  it('accepte un rôle avec un handler partagé', () => {
    const handler = (): void => undefined;
    Roles('ADMIN')(handler, undefined as never);
    expect(guard.canActivate(contextFor(handler, userWithRoles('ADMIN')))).toBe(true);
  });

  it('garde la métadonnée lisible par le Reflector', () => {
    const handler = (): void => undefined;
    Roles('ORDER_MANAGER', 'ADMIN')(handler, undefined as never);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['ORDER_MANAGER', 'ADMIN']);
  });
});

import 'reflect-metadata';

import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { ROLES_KEY, Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function contextFor(
  handler: (...args: unknown[]) => unknown,
  user?: AuthenticatedUser,
): ExecutionContext {
  // Express 5 n'expose plus `Request` comme valeur au runtime : on construit
  // une requête minimale, le garde ne lit que `user`.
  const request = { user } as unknown as Request & { user?: AuthenticatedUser };
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

// Applique @Roles hors décorateur de classe : SetMetadata n'a besoin que de la
// cible et de la clé pour poser la métadonnée sur le handler.
function applyRoles(handler: (...args: unknown[]) => unknown, ...roles: string[]): void {
  (Roles(...roles) as unknown as (target: object, key: string) => void)(handler, 'handler');
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
    applyRoles(handler, 'STOCK_MANAGER');
    expect(guard.canActivate(contextFor(handler, userWithRoles('STOCK_MANAGER')))).toBe(true);
  });

  it('refuse un rôle absent (403)', () => {
    const handler = (): void => undefined;
    applyRoles(handler, 'ADMIN');
    expect(() => guard.canActivate(contextFor(handler, userWithRoles('LIVREUR')))).toThrow(
      ForbiddenException,
    );
  });

  it('accepte un rôle avec un handler partagé', () => {
    const handler = (): void => undefined;
    applyRoles(handler, 'ADMIN');
    expect(guard.canActivate(contextFor(handler, userWithRoles('ADMIN')))).toBe(true);
  });

  it('SUPER_ADMIN ouvre toutes les portes (cachier §2)', () => {
    const handler = (): void => undefined;
    applyRoles(handler, 'STOCK_MANAGER');
    expect(guard.canActivate(contextFor(handler, userWithRoles('SUPER_ADMIN')))).toBe(true);
  });

  it("401 si aucune identité alors qu'un rôle est exigé", () => {
    const handler = (): void => undefined;
    applyRoles(handler, 'ADMIN');
    expect(() => guard.canActivate(contextFor(handler, undefined))).toThrow(UnauthorizedException);
  });

  it('accepte un rôle avec un handler partagé', () => {
    const handler = (): void => undefined;
    applyRoles(handler, 'ADMIN');
    expect(guard.canActivate(contextFor(handler, userWithRoles('ADMIN')))).toBe(true);
  });

  it('garde la métadonnée lisible par le Reflector', () => {
    const handler = (): void => undefined;
    applyRoles(handler, 'ORDER_MANAGER', 'ADMIN');
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['ORDER_MANAGER', 'ADMIN']);
  });
});

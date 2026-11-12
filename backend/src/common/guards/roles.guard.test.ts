import 'reflect-metadata';

import type { ExecutionContext, Type } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY, Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function contextFor(
  handler: (...args: unknown[]) => unknown,
  user?: AuthenticatedUser,
  controller: Type<unknown> = class TestController {},
): ExecutionContext {
  // Express 5 n'expose plus `Request` comme valeur au runtime : on construit
  // une requête minimale, le garde ne lit que `user`.
  const request = { user } as unknown as Request & { user?: AuthenticatedUser };
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function handlerWithRoles(...roles: string[]): (...args: unknown[]) => unknown {
  const handler = (): void => undefined;
  Reflect.defineMetadata(ROLES_KEY, roles, handler);
  return handler;
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

  it('laisse passer une route authentifiée sans @Roles', () => {
    const handler = (): void => undefined;
    expect(guard.canActivate(contextFor(handler, userWithRoles()))).toBe(true);
  });

  it('accepte un rôle autorisé', () => {
    const handler = handlerWithRoles('STOCK_MANAGER');
    expect(guard.canActivate(contextFor(handler, userWithRoles('STOCK_MANAGER')))).toBe(true);
  });

  it('refuse un rôle absent (403 FORBIDDEN)', () => {
    const handler = handlerWithRoles('ADMIN');
    expect(() => guard.canActivate(contextFor(handler, userWithRoles('LIVREUR')))).toThrow(
      ForbiddenException,
    );
  });

  it('SUPER_ADMIN ouvre toutes les portes', () => {
    const handler = handlerWithRoles('STOCK_MANAGER');
    expect(guard.canActivate(contextFor(handler, userWithRoles('SUPER_ADMIN')))).toBe(true);
  });

  it('refuse un utilisateur sans aucun rôle quand un rôle est exigé', () => {
    const handler = handlerWithRoles('ADMIN');
    expect(() => guard.canActivate(contextFor(handler, userWithRoles()))).toThrow(
      ForbiddenException,
    );
  });

  it('renvoie 401 UNAUTHORIZED sans identité quand un rôle est exigé', () => {
    const handler = handlerWithRoles('ADMIN');
    try {
      guard.canActivate(contextFor(handler, undefined));
      throw new Error('expected UnauthorizedException');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toMatchObject({
        code: 'UNAUTHORIZED',
      });
    }
  });

  it('hérite des rôles déclarés au niveau classe', () => {
    class AdminController {}
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], AdminController);
    const handler = (): void => undefined;
    expect(guard.canActivate(contextFor(handler, userWithRoles('ADMIN'), AdminController))).toBe(
      true,
    );
  });

  it('donne la priorité au @Roles de la méthode sur celui de la classe', () => {
    class AdminController {}
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], AdminController);
    const handler = handlerWithRoles('STOCK_MANAGER');
    expect(
      guard.canActivate(contextFor(handler, userWithRoles('STOCK_MANAGER'), AdminController)),
    ).toBe(true);
    expect(() =>
      guard.canActivate(contextFor(handler, userWithRoles('ADMIN'), AdminController)),
    ).toThrow(ForbiddenException);
  });

  it('@Public gagne sur @Roles, même sans utilisateur', () => {
    class PublicController {}
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], PublicController);
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, PublicController);
    const handler = handlerWithRoles('SUPER_ADMIN');
    expect(guard.canActivate(contextFor(handler, undefined, PublicController))).toBe(true);
  });

  it('@Public sur la méthode gagne sur les rôles de la classe', () => {
    class AdminController {}
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], AdminController);
    const handler = (): void => undefined;
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
    Reflect.defineMetadata(ROLES_KEY, ['SUPER_ADMIN'], handler);
    expect(guard.canActivate(contextFor(handler, undefined, AdminController))).toBe(true);
  });

  it('expose la métadonnée du décorateur @Roles', () => {
    class AdminController {}
    Roles('ORDER_MANAGER', 'ADMIN')(AdminController);
    expect(Reflect.getMetadata(ROLES_KEY, AdminController)).toEqual(['ORDER_MANAGER', 'ADMIN']);
  });
});

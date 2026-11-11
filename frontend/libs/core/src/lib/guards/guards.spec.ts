import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionService } from '../session/session.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { roleGuard } from './role.guard';

describe('guards (TEC-12)', () => {
  let session: SessionService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionService],
    });
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  function user(roles: string[]) {
    session.setSession('token', {
      id: 'u',
      email: null,
      phone: null,
      firstName: null,
      lastName: null,
      status: 'ACTIVE',
      roles,
    });
  }

  it('authGuard laisse passer un utilisateur connecté', () => {
    user(['CUSTOMER']);
    expect(
      TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/compte' } as never)),
    ).toBe(true);
  });

  it('authGuard redirige vers login avec returnUrl', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/compte' } as never),
    );
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/connexion?returnUrl=%2Fcompte');
  });

  it('roleGuard laisse passer un rôle autorisé', () => {
    user(['ADMIN']);
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['ADMIN', 'STOCK_MANAGER'])({} as never, { url: '/produits' } as never),
    );
    expect(result).toBe(true);
  });

  it('roleGuard redirige vers /403 si rôle insuffisant', () => {
    user(['CUSTOMER']);
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['ADMIN'])({} as never, { url: '/produits' } as never),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/403');
  });

  it('roleGuard redirige vers login si non connecté', () => {
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['ADMIN'])({} as never, { url: '/produits' } as never),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/connexion?returnUrl=%2Fproduits');
  });

  it('roleGuard laisse passer SUPER_ADMIN', () => {
    user(['SUPER_ADMIN']);
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['ADMIN'])({} as never, { url: '/produits' } as never),
    );
    expect(result).toBe(true);
  });

  it('guestGuard redirige vers home si connecté', () => {
    user(['CUSTOMER']);
    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as never, { url: '/' } as never),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/compte');
  });

  it('guestGuard laisse passer un invité', () => {
    expect(
      TestBed.runInInjectionContext(() => guestGuard({} as never, { url: '/' } as never)),
    ).toBe(true);
  });
});

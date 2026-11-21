import { describe, expect, it } from 'vitest';
import { authGuard, guestGuard } from '@bruny/core';
import { appRoutes } from './app.routes';

function route(path: string) {
  return appRoutes.find((entry) => entry.path === path);
}

describe('routes AUT-09', () => {
  it('expose /connexion en lazy loading avec guestGuard', () => {
    const login = route('connexion');

    expect(login?.loadComponent).toBeTypeOf('function');
    expect(login?.canActivate).toContain(guestGuard);
    expect(login?.data?.['title']).toBe('Se connecter');
  });

  it('expose /inscription en lazy loading avec guestGuard', () => {
    const register = route('inscription');

    expect(register?.loadComponent).toBeTypeOf('function');
    expect(register?.canActivate).toContain(guestGuard);
    expect(register?.data?.['title']).toBe('Créer un compte');
  });

  it('protège /compte avec authGuard', () => {
    const account = route('compte');

    expect(account?.canActivate).toContain(authGuard);
  });
});

describe('routes MKT-02', () => {
  it('expose /contact en lazy loading', () => {
    const contact = route('contact');

    expect(contact?.loadComponent).toBeTypeOf('function');
    expect(contact?.data?.['title']).toBe('Contact');
  });
});

describe('routes MKT-01', () => {
  const mkt01Paths = [
    'a-propos',
    'faq',
    'livraison',
    'retours',
    'guide-des-tailles',
    'cgv',
    'politique-confidentialite',
    'mentions-legales',
  ];

  for (const path of mkt01Paths) {
    it(`expose /${path} en lazy loading`, () => {
      const entry = route(path);

      expect(entry?.loadComponent).toBeTypeOf('function');
      expect(entry?.data?.['title']).toBeTruthy();
    });
  }

  it('redirige /confidentialite vers la politique de confidentialité', () => {
    const legacy = route('confidentialite');

    expect(legacy?.redirectTo).toBe('politique-confidentialite');
    expect(legacy?.pathMatch).toBe('full');
  });

  it('conserve la route catch-all vers la boutique', () => {
    expect(appRoutes.at(-1)?.path).toBe('**');
    expect(appRoutes.at(-1)?.redirectTo).toBe('boutique');
  });
});

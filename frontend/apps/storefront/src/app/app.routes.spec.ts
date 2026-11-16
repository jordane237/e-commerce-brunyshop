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

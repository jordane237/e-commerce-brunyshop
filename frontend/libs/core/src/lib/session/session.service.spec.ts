import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService, type SessionUser } from './session.service';

const USER: SessionUser = {
  id: 'user-1',
  email: 'admin@bruny.test',
  phone: null,
  firstName: 'Awa',
  lastName: 'Nkeng',
  status: 'ACTIVE',
  roles: ['ADMIN', 'SUPER_ADMIN'],
};

describe('SessionService (TEC-12)', () => {
  let service: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('garde le jeton et l’utilisateur en mémoire', () => {
    service.setSession('access-token', USER);

    expect(service.accessToken()).toBe('access-token');
    expect(service.user()).toEqual(USER);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRoles()).toEqual(['ADMIN', 'SUPER_ADMIN']);
  });

  it('efface complètement la session', () => {
    service.setSession('access-token', USER);
    service.clearSession();

    expect(service.accessToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('met à jour le profil sans changer le jeton', () => {
    service.setSession('access-token', USER);
    service.setSession('access-token', { ...USER, firstName: 'Nouveau' });

    expect(service.user()?.firstName).toBe('Nouveau');
    expect(service.accessToken()).toBe('access-token');
  });

  it('gère les rôles', () => {
    service.setSession('access-token', USER);

    expect(service.hasRole('ADMIN')).toBe(true);
    expect(service.hasRole('CUSTOMER')).toBe(false);
    expect(service.hasAnyRole(['CUSTOMER', 'SUPER_ADMIN'])).toBe(true);
    expect(service.hasAnyRole([])).toBe(false);
  });

  it('ne stocke jamais le jeton dans localStorage, sessionStorage ou document.cookie', () => {
    const localSet = vi.spyOn(Storage.prototype, 'setItem');
    const cookieBefore = document.cookie;

    service.setSession('access-token', USER);
    service.setAccessToken('rotated-token');
    service.clearSession();

    expect(localSet).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe(cookieBefore);
    localSet.mockRestore();
  });
});

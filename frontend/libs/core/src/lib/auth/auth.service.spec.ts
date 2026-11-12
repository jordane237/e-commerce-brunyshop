import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@bruny/data-access';
import { SessionService, type SessionUser } from '../session/session.service';
import { AuthService } from './auth.service';

const USER: SessionUser = {
  id: 'user-1',
  email: 'admin@bruny.test',
  phone: null,
  firstName: 'Awa',
  lastName: 'Nkeng',
  status: 'ACTIVE',
  roles: ['ADMIN'],
};

describe('AuthService (TEC-12)', () => {
  let auth: AuthService;
  let session: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    auth = TestBed.inject(AuthService);
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ouvre la session après login', () => {
    auth.login({ identifier: 'admin@bruny.test', password: 'secret' }).subscribe();

    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('X-Skip-Error-Toast')).toBe('true');
    request.flush({ accessToken: 'token-1', user: USER });

    expect(session.isAuthenticated()).toBe(true);
    expect(session.accessToken()).toBe('token-1');
  });

  it('ne crée pas de session sur un défi 2FA', () => {
    auth.login({ identifier: 'admin@bruny.test', password: 'secret' }).subscribe();
    http
      .expectOne('/api/v1/auth/login')
      .flush({ twoFactorRequired: true, challengeToken: 'challenge' });

    expect(session.isAuthenticated()).toBe(false);
  });

  it('recharge le profil après refresh et restaure la session', () => {
    let restored = false;
    auth.restoreSession().subscribe((value) => (restored = value));

    http.expectOne('/api/v1/auth/refresh').flush({ accessToken: 'token-2' });
    expect(session.accessToken()).toBe('token-2');
    expect(session.isAuthenticated()).toBe(false);

    http.expectOne('/api/v1/me').flush(USER);
    expect(restored).toBe(true);
    expect(session.isAuthenticated()).toBe(true);
    expect(session.user()).toEqual(USER);
  });

  it('retourne false et efface la session si le refresh échoue', () => {
    let restored: boolean | undefined;
    auth.restoreSession().subscribe((value) => (restored = value));
    http
      .expectOne('/api/v1/auth/refresh')
      .flush({ code: 'SESSION_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });

    expect(restored).toBe(false);
    expect(session.isAuthenticated()).toBe(false);
  });

  it('efface la session au logout même si l’appel échoue', () => {
    session.setSession('token-3', USER);
    auth.logout().subscribe({ error: () => undefined });
    http
      .expectOne('/api/v1/auth/logout')
      .flush({ code: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });

    expect(session.isAuthenticated()).toBe(false);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LoginDto } from './api-contracts';
import { SessionService } from './session.service';

// TEC-09 CA2 : le service de session consomme le DTO généré depuis
// `backend/openapi.json`. Si le backend renomme un champ de LoginDto,
// `pnpm api:generate` met le type à jour et ce test ne compile plus.
describe('SessionService — contrats générés', () => {
  let service: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('envoie un LoginDto généré et mémorise la session', () => {
    const credentials: LoginDto = { identifier: 'admin@exemple.cm', password: 'mot-de-passe' };
    let received: unknown;

    service.login(credentials).subscribe((response) => (received = response));

    const request = http.expectOne('http://localhost:4000/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      accessToken: 'access-token',
      user: {
        id: 'e6f6b5c4-3a2b-4c1d-9e8f-102030405060',
        email: 'admin@exemple.cm',
        phone: null,
        firstName: 'Awa',
        lastName: 'Nkeng',
        status: 'ACTIVE',
        roles: ['ADMIN'],
      },
    });

    expect(received).toMatchObject({ accessToken: 'access-token' });
    expect(service.token()).toBe('access-token');
    expect(service.roles()).toEqual(['ADMIN']);
  });

  it('expose un défi 2FA sans ouvrir de session', () => {
    service.login({ identifier: '+237600000000', password: 'mot-de-passe' }).subscribe();

    const request = http.expectOne('http://localhost:4000/api/v1/auth/login');
    request.flush({ twoFactorRequired: true, challengeToken: 'challenge-token' });

    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
  });
});

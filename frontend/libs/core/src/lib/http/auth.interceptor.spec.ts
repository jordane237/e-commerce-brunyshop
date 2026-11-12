import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RefreshQueueService } from '../auth/refresh-queue.service';
import { SessionService, type SessionUser } from '../session/session.service';
import { authInterceptor } from './auth.interceptor';

const USER: SessionUser = {
  id: 'user-1',
  email: 'admin@bruny.test',
  phone: null,
  firstName: 'Awa',
  lastName: 'Nkeng',
  status: 'ACTIVE',
  roles: ['ADMIN'],
};

describe('authInterceptor (TEC-12)', () => {
  let session: SessionService;
  let queue: { enqueue: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    queue = { enqueue: vi.fn(() => of(new HttpResponse({ status: 200 }))) };
    TestBed.configureTestingModule({
      providers: [SessionService, { provide: RefreshQueueService, useValue: queue }],
    });
    session = TestBed.inject(SessionService);
  });

  function run(request: HttpRequest<unknown>, next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => authInterceptor(request, next));
  }

  it('ajoute le Bearer et withCredentials quand un jeton existe', () => {
    session.setSession('token-1', USER);
    let outgoing!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (request) => {
      outgoing = request;
      return of(new HttpResponse({ status: 200 }));
    };

    run(new HttpRequest('GET', '/api/v1/me'), next).subscribe();

    expect(outgoing.headers.get('Authorization')).toBe('Bearer token-1');
    expect(outgoing.withCredentials).toBe(true);
  });

  it('n’ajoute pas de Bearer sur login même avec un jeton en mémoire', () => {
    session.setSession('token-1', USER);
    let outgoing!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (request) => {
      outgoing = request;
      return of(new HttpResponse({ status: 200 }));
    };

    run(new HttpRequest('POST', '/api/v1/auth/login'), next).subscribe();

    expect(outgoing.headers.has('Authorization')).toBe(false);
  });

  it('ajoute le Bearer sur logout, qui est une route protégée', () => {
    session.setSession('token-1', USER);
    let outgoing!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (request) => {
      outgoing = request;
      return of(new HttpResponse({ status: 200 }));
    };

    run(new HttpRequest('POST', '/api/v1/auth/logout'), next).subscribe();

    expect(outgoing.headers.get('Authorization')).toBe('Bearer token-1');
  });

  it('délègue un 401 protégé à la file de refresh', () => {
    session.setSession('token-1', USER);
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    run(new HttpRequest('GET', '/api/v1/me'), next).subscribe();

    expect(queue.enqueue).toHaveBeenCalledTimes(1);
  });

  it('ne tente pas de refresh sur /auth/refresh', () => {
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    run(new HttpRequest('POST', '/api/v1/auth/refresh'), next).subscribe({
      error: () => undefined,
    });

    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});

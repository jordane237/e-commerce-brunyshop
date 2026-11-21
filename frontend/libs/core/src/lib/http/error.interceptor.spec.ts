import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_LOGIN_PATH } from '../tokens';
import { SessionService } from '../session/session.service';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from './toast.service';

function run(config: {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  requestHeaders?: Record<string, string>;
  url?: string;
}) {
  const next: HttpHandlerFn = () =>
    throwError(
      () =>
        new HttpErrorResponse({
          status: config.status,
          error: config.body,
        }),
    );
  return TestBed.runInInjectionContext(() =>
    errorInterceptor(
      new HttpRequest('GET', config.url ?? '/api/v1/products', null, {
        headers: config.requestHeaders,
      }),
      next,
    ),
  );
}

describe('errorInterceptor (TEC-12)', () => {
  let session: SessionService;
  let toast: ToastService;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        ToastService,
        { provide: AUTH_LOGIN_PATH, useValue: '/connexion' },
        { provide: Router, useValue: { url: '/produits', navigate } },
      ],
    });
    session = TestBed.inject(SessionService);
    toast = TestBed.inject(ToastService);
    vi.spyOn(toast, 'error');
  });

  it('ne toast pas pour 401', () => {
    run({ status: 401 }).subscribe({
      error: () => undefined,
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('ne toast pas quand X-Skip-Error-Toast est présent', () => {
    run({ status: 400, requestHeaders: { 'X-Skip-Error-Toast': 'true' } }).subscribe({
      error: () => undefined,
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('ne toast pas pour CAPTCHA_*', () => {
    run({ status: 400, body: { code: 'CAPTCHA_REQUIRED' } }).subscribe({ error: () => undefined });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('affiche le toast réseau pour status 0', () => {
    run({ status: 0 }).subscribe({
      error: () => undefined,
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Connexion impossible. Vérifiez votre réseau et réessayez.',
    );
  });

  it('affiche le toast accès pour 403', () => {
    run({ status: 403 }).subscribe({
      error: () => undefined,
    });
    expect(toast.error).toHaveBeenCalledWith("Vous n'avez pas accès à cette page.");
  });

  it('affiche le toast session expirée pour SESSION_REUSE_DETECTED', () => {
    session.setSession('token', {
      id: 'u',
      email: null,
      phone: null,
      firstName: null,
      lastName: null,
      status: 'ACTIVE',
      roles: [],
    });
    run({ status: 401, body: { code: 'SESSION_REUSE_DETECTED' } }).subscribe({
      error: () => undefined,
    });
    expect(session.isAuthenticated()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      'Votre session a été révoquée pour des raisons de sécurité. Reconnectez-vous.',
    );
  });

  it('ajoute la référence pour les erreurs 5xx', () => {
    run({ status: 500, body: { requestId: '1234567890abcdef' } }).subscribe({
      error: () => undefined,
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Une erreur est survenue. Réessayez dans quelques instants. (réf. 12345678)',
    );
  });
});

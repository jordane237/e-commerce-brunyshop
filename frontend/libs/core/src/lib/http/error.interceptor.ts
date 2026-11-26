import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AUTH_LOGIN_PATH } from '../tokens';
import { SessionService } from '../session/session.service';
import { readApiError, readApiErrorMessage } from './api-error';
import { ToastService } from './toast.service';

const CAPTCHA_CODES = new Set(['CAPTCHA_REQUIRED', 'CAPTCHA_INVALID', 'CAPTCHA_UNAVAILABLE']);

function messageFor(error: HttpErrorResponse): string {
  const body = readApiError(error);
  switch (error.status) {
    case 0:
      return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
    case 400:
      return readApiErrorMessage(error, 'Vérifiez les informations saisies.');
    case 403:
      return "Vous n'avez pas accès à cette page.";
    case 404:
      return "Cette page n'existe pas ou a été déplacée.";
    case 409:
      return readApiErrorMessage(error, 'Un conflit est survenu. Vérifiez les informations.');
    case 422:
      return readApiErrorMessage(error, 'Les données saisies ne sont pas valides.');
    case 429:
      return 'Trop de tentatives. Patientez une minute avant de réessayer.';
    case 500:
    case 502:
    case 503:
    case 504: {
      const reference = body?.requestId;
      return `Une erreur est survenue. Réessayez dans quelques instants.${
        typeof reference === 'string' && reference !== '' ? ` (réf. ${reference.slice(0, 8)})` : ''
      }`;
    }
    default:
      return readApiErrorMessage(error, 'Une erreur est survenue. Réessayez.');
  }
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toast = inject(ToastService);
  const session = inject(SessionService);
  const router = inject(Router);
  const loginPath = inject(AUTH_LOGIN_PATH);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

      const body = readApiError(error);
      const code = body?.code;
      const silent = request.headers.has('X-Skip-Error-Toast');

      // The refresh queue owns the forced logout. A silent refresh must not
      // produce a second toast or a second redirect.
      if (!silent && code === 'SESSION_REUSE_DETECTED') {
        session.clearSession();
        toast.error('Votre session a été révoquée pour des raisons de sécurité. Reconnectez-vous.');
        const returnUrl = router.url;
        void router.navigate([loginPath], {
          queryParams: returnUrl !== loginPath && returnUrl !== '/' ? { returnUrl } : {},
        });
        return throwError(() => error);
      }

      // 401 is handled by authInterceptor + RefreshQueueService.
      if (silent || error.status === 401) return throwError(() => error);

      // Form-level errors must stay in the form, next to the invalid field.
      if (code !== undefined && CAPTCHA_CODES.has(code)) return throwError(() => error);

      toast.error(messageFor(error));
      return throwError(() => error);
    }),
  );
};

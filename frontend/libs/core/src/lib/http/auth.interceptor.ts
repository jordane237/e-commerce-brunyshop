import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { RefreshQueueService } from '../auth/refresh-queue.service';
import { SessionService } from '../session/session.service';

const NO_ACCESS_TOKEN = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const NO_REFRESH = [...NO_ACCESS_TOKEN, '/auth/2fa/'];

function matches(url: string, paths: string[]): boolean {
  return paths.some((path) => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const queue = inject(RefreshQueueService);
  const token = session.accessToken();
  const skipAccessToken = matches(request.url, NO_ACCESS_TOKEN);
  const canRefresh = !matches(request.url, NO_REFRESH);
  const outgoing = request.clone({
    withCredentials: true,
    ...(token !== null && !skipAccessToken
      ? { setHeaders: { Authorization: `Bearer ${token}` } }
      : {}),
  });

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        canRefresh &&
        outgoing.headers.has('Authorization')
      ) {
        return queue.enqueue(outgoing, next);
      }
      return throwError(() => error);
    }),
  );
};

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { SessionService } from './session.service';

export const httpErrorMessage = signal('');
export const httpPendingCount = signal(0);

export const requestInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const token = session.token();
  const isAuthEndpoint = request.url.includes('/auth/');
  const outgoing = request.clone({
    setHeaders: {
      'X-Request-Id': requestId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(isAuthEndpoint || token ? { withCredentials: true } : {}),
  });
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }
      return session.refresh().pipe(
        switchMap(() =>
          next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${session.token() ?? ''}`,
                'X-Request-Id': requestId,
              },
              withCredentials: true,
            }),
          ),
        ),
      );
    }),
  );
};

export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      const response = error instanceof HttpErrorResponse ? error : null;
      const body = response?.error as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
      httpErrorMessage.set(message || 'Une erreur est survenue. Réessayez.');
      return throwError(() => error);
    }),
  );

export const loadingInterceptor: HttpInterceptorFn = (_request, next) => {
  httpPendingCount.update((count) => count + 1);
  return next(_request).pipe(
    finalize(() => httpPendingCount.update((count) => Math.max(0, count - 1))),
  );
};

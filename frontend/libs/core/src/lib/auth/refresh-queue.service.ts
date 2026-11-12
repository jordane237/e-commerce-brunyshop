import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';

import { AUTH_LOGIN_PATH } from '../tokens';
import { ToastService } from '../http/toast.service';
import { SessionService } from '../session/session.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RefreshQueueService {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly loginPath = inject(AUTH_LOGIN_PATH);
  private refreshInFlight?: Observable<{ accessToken: string }>;

  enqueue(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    return this.refreshOnce().pipe(
      switchMap(() => {
        const token = this.session.accessToken();
        if (token === null || token === '') {
          return throwError(() => new Error('Session refresh did not return an access token.'));
        }
        return next(
          request.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
        );
      }),
    );
  }

  private refreshOnce(): Observable<{ accessToken: string }> {
    if (this.refreshInFlight === undefined) {
      this.refreshInFlight = this.auth.refresh().pipe(
        catchError((error: unknown) => {
          this.session.clearSession();
          this.toast.error('Votre session a expiré. Reconnectez-vous.');
          const returnUrl = this.router.url;
          void this.router.navigate([this.loginPath], {
            queryParams: returnUrl !== this.loginPath && returnUrl !== '/' ? { returnUrl } : {},
          });
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshInFlight = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInFlight;
  }
}

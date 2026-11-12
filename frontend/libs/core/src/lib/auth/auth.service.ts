import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';

import type { LoginDto } from '@bruny/data-access';
import { API_BASE_URL } from '@bruny/data-access';
import { SessionService, type SessionUser } from '../session/session.service';

export interface AuthResponse {
  accessToken: string;
  expiresIn?: number;
  user: SessionUser;
}

export interface AuthChallenge {
  twoFactorRequired: true;
  setupRequired?: true;
  challengeToken: string;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
}

const SILENT_HEADERS = {
  'X-Skip-Error-Toast': 'true',
  'X-Skip-Loading': 'true',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly session = inject(SessionService);

  login(credentials: LoginDto): Observable<AuthResponse | AuthChallenge> {
    return this.http
      .post<
        AuthResponse | AuthChallenge
      >(`${this.baseUrl}/auth/login`, credentials, { withCredentials: true, headers: { 'X-Skip-Error-Toast': 'true' } })
      .pipe(
        tap((response) => {
          if ('accessToken' in response) this.accept(response);
        }),
      );
  }

  setupTwoFactor(challengeToken: string): Observable<TwoFactorSetup> {
    return this.http.post<TwoFactorSetup>(
      `${this.baseUrl}/auth/2fa/setup`,
      {},
      {
        headers: {
          ...SILENT_HEADERS,
          Authorization: `Bearer ${challengeToken}`,
        },
        withCredentials: true,
      },
    );
  }

  verifyTwoFactor(challengeToken: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/auth/2fa/verify`,
        { code },
        {
          headers: {
            ...SILENT_HEADERS,
            Authorization: `Bearer ${challengeToken}`,
          },
          withCredentials: true,
        },
      )
      .pipe(tap((response) => this.accept(response)));
  }

  /**
   * Rotates the refresh cookie and updates only the access token. The profile
   * is fetched separately by restoreSession(): the backend deliberately does
   * not return the user on /auth/refresh.
   */
  refresh(): Observable<{ accessToken: string }> {
    return this.http
      .post<{
        accessToken: string;
      }>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true, headers: SILENT_HEADERS })
      .pipe(tap((response) => this.session.setAccessToken(response.accessToken)));
  }

  loadProfile(): Observable<SessionUser> {
    return this.http
      .get<SessionUser>(`${this.baseUrl}/me`, { headers: SILENT_HEADERS, withCredentials: true })
      .pipe(tap((user) => this.session.updateUser(user)));
  }

  restoreSession(): Observable<boolean> {
    return this.refresh().pipe(
      switchMap(() => this.loadProfile()),
      map(() => true),
      catchError(() => {
        this.session.clearSession();
        return of(false);
      }),
    );
  }

  logout(): Observable<{ ok: true }> {
    return this.http
      .post<{
        ok: true;
      }>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true, headers: { 'X-Skip-Error-Toast': 'true' } })
      .pipe(finalize(() => this.session.clearSession()));
  }

  private accept(response: AuthResponse): void {
    this.session.setSession(response.accessToken, response.user);
  }
}

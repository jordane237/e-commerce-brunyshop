import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  finalize,
  map,
  Observable,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { API_BASE_URL } from './catalog-api';

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
}

interface AuthResponse {
  accessToken: string;
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

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly tokenState = signal<string | null>(null);
  private readonly userState = signal<SessionUser | null>(null);
  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly roles = computed(() => this.userState()?.roles ?? []);
  private refreshRequest?: Observable<{ accessToken: string }>;

  login(identifier: string, password: string): Observable<AuthResponse | AuthChallenge> {
    return this.http
      .post<
        AuthResponse | AuthChallenge
      >(`${this.baseUrl}/auth/login`, { identifier, password }, { withCredentials: true })
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
        headers: { Authorization: `Bearer ${challengeToken}` },
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
          headers: { Authorization: `Bearer ${challengeToken}` },
          withCredentials: true,
        },
      )
      .pipe(tap((response) => this.accept(response)));
  }

  refresh(): Observable<{ accessToken: string }> {
    if (!this.refreshRequest) {
      this.refreshRequest = this.http
        .post<{
          accessToken: string;
        }>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          tap((response) => this.tokenState.set(response.accessToken)),
          catchError((error: unknown) => {
            this.clear();
            return throwError(() => error);
          }),
          finalize(() => (this.refreshRequest = undefined)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refreshRequest;
  }

  restore(): Observable<{ accessToken: string }> {
    return this.refresh().pipe(
      switchMap((response) =>
        this.http.get<SessionUser>(`${this.baseUrl}/me`).pipe(
          tap((user) => this.userState.set(user)),
          map(() => response),
        ),
      ),
    );
  }

  logout(): Observable<{ ok: true }> {
    return this.http
      .post<{ ok: true }>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clear()));
  }

  clear(): void {
    this.tokenState.set(null);
    this.userState.set(null);
  }

  private accept(response: AuthResponse): void {
    this.tokenState.set(response.accessToken);
    this.userState.set(response.user);
  }
}

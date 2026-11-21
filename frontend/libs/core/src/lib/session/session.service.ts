import { computed, Injectable, signal } from '@angular/core';

export type SessionStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING_VERIFICATION';

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  status: SessionStatus | string;
  roles: string[];
}

/**
 * The access token lives in memory only. The refresh token is a HttpOnly
 * cookie managed by the browser and is never readable from JavaScript.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly accessTokenState = signal<string | null>(null);
  private readonly userState = signal<SessionUser | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(
    () => this.accessTokenState() !== null && this.userState() !== null,
  );
  readonly userRoles = computed(() => this.userState()?.roles ?? []);

  setSession(accessToken: string, user: SessionUser): void {
    this.accessTokenState.set(accessToken);
    this.userState.set(user);
  }

  setAccessToken(accessToken: string): void {
    this.accessTokenState.set(accessToken);
  }

  clearSession(): void {
    this.accessTokenState.set(null);
    this.userState.set(null);
  }

  updateUser(user: SessionUser): void {
    this.userState.set(user);
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.userRoles();
    return roles.some((role) => userRoles.includes(role));
  }
}

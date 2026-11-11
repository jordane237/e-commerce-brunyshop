import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../session/session.service';
import { AUTH_FORBIDDEN_PATH, AUTH_LOGIN_PATH } from '../tokens';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (_route, state) => {
    const session = inject(SessionService);
    const router = inject(Router);
    const loginPath = inject(AUTH_LOGIN_PATH);
    const forbiddenPath = inject(AUTH_FORBIDDEN_PATH);

    if (!session.isAuthenticated()) {
      return router.createUrlTree([loginPath], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (session.hasRole('SUPER_ADMIN') || session.hasAnyRole(allowedRoles)) {
      return true;
    }

    return router.createUrlTree([forbiddenPath]);
  };
}

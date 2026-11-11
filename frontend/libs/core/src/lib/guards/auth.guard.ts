import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../session/session.service';
import { AUTH_LOGIN_PATH } from '../tokens';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const loginPath = inject(AUTH_LOGIN_PATH);

  if (session.isAuthenticated()) return true;

  return router.createUrlTree([loginPath], {
    queryParams: { returnUrl: state.url },
  });
};

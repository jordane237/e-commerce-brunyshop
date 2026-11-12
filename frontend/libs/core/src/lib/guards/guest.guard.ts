import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../session/session.service';
import { AUTH_HOME_PATH } from '../tokens';

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const homePath = inject(AUTH_HOME_PATH);

  return session.isAuthenticated() ? router.createUrlTree([homePath]) : true;
};

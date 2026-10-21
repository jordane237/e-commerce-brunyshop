import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService } from '@bruny/data-access';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  if (session.user()) return true;
  return session.restore().pipe(
    map(() => true),
    catchError(() =>
      of(router.createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } })),
    ),
  );
};

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const expected = route.data['roles'] as string[] | undefined;
  const roles = session.roles();
  return !expected?.length ||
    roles.includes('SUPER_ADMIN') ||
    expected.some((role) => roles.includes(role))
    ? true
    : router.createUrlTree(['/acces-refuse']);
};

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.user() ? router.createUrlTree(['/produits']) : true;
};

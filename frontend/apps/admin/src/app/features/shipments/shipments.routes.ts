import { Route } from '@angular/router';
import { roleGuard } from '@bruny/core';
import { navRoles } from '../../layout/navigation/nav-items.config';

export const SHIPMENTS_ROUTES: Route[] = [
  {
    path: '',
    canActivate: [roleGuard(navRoles('shipments'))],
    data: { title: 'Livraisons', breadcrumb: 'Livraisons' },
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((module) => module.PlaceholderPage),
  },
  {
    path: 'mes-livraisons',
    canActivate: [roleGuard(navRoles('my-deliveries'))],
    data: { title: 'Mes livraisons du jour', breadcrumb: 'Mes livraisons' },
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((module) => module.PlaceholderPage),
  },
];

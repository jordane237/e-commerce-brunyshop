import { Route } from '@angular/router';
import { roleGuard } from '@bruny/core';
import { navRoles } from '../../layout/navigation/nav-items.config';

export const DELIVERY_ZONES_ROUTES: Route[] = [
  {
    path: '',
    canActivate: [roleGuard(navRoles('delivery-zones'))],
    data: { title: 'Zones de livraison', breadcrumb: 'Zones de livraison' },
    loadComponent: () =>
      import('./delivery-zones-list/delivery-zones-list.component').then(
        (m) => m.DeliveryZonesListComponent,
      ),
  },
];

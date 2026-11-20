import { Route } from '@angular/router';

export const ORDERS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((module) => module.PlaceholderPage),
  },
];

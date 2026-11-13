import { Route } from '@angular/router';

export const CUSTOMERS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((module) => module.PlaceholderPage),
  },
];

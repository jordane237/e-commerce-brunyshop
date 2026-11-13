import { Route } from '@angular/router';

export const REVIEWS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((module) => module.PlaceholderPage),
  },
];

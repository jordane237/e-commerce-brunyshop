import { Route } from '@angular/router';

export const SETTINGS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((module) => module.PlaceholderPage),
  },
];

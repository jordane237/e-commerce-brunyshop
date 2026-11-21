import { Route } from '@angular/router';

export const homeRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./home.component').then((module) => module.HomeComponent),
  },
];

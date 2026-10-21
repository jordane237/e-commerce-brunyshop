import { Route } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'produits' },
  {
    path: 'connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'produits',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'STOCK_MANAGER'] },
    loadComponent: () =>
      import('./features/products/products-page').then((module) => module.ProductsPage),
  },
  {
    path: 'acces-refuse',
    loadComponent: () =>
      import('./features/pages/access-denied-page').then((module) => module.AccessDeniedPage),
  },
  { path: '**', redirectTo: 'produits' },
];

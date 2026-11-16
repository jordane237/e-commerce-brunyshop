import { Route } from '@angular/router';
import { authGuard, guestGuard } from '@bruny/core';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./features/home/home.routes').then((module) => module.homeRoutes),
  },
  {
    path: 'boutique',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then((module) => module.catalogRoutes),
  },
  {
    path: 'produit/:slug',
    loadComponent: () =>
      import('./features/product/product-page').then((module) => module.ProductPage),
  },
  {
    path: 'panier',
    loadComponent: () => import('./features/cart/cart-page').then((module) => module.CartPage),
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((module) => module.LoginComponent),
    canActivate: [guestGuard],
    data: { title: 'Se connecter' },
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
    canActivate: [guestGuard],
    data: { title: 'Créer un compte' },
  },
  {
    path: 'compte',
    loadComponent: () =>
      import('./features/account/account-page').then((module) => module.AccountPage),
    canActivate: [authGuard],
    data: { title: 'Mon compte' },
  },
  {
    path: 'design-system',
    loadComponent: () =>
      import('./features/design-system/design-system-page').then(
        (module) => module.DesignSystemPage,
      ),
  },
  { path: '**', redirectTo: 'boutique' },
];

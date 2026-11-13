import { Route } from '@angular/router';

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
    path: 'design-system',
    loadComponent: () =>
      import('./features/design-system/design-system-page').then(
        (module) => module.DesignSystemPage,
      ),
  },
  { path: '**', redirectTo: 'boutique' },
];

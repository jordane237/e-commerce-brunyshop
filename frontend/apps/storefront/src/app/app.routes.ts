import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'boutique' },
  {
    path: 'boutique',
    loadComponent: () =>
      import('./features/catalog/catalog-page').then((module) => module.CatalogPage),
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
  { path: '**', redirectTo: 'boutique' },
];

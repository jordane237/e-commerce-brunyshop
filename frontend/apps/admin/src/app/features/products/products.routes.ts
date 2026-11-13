import { Route } from '@angular/router';

export const PRODUCTS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./products-page').then((module) => module.ProductsPage),
  },
];

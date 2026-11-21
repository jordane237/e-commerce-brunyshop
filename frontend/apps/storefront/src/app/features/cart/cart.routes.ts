import { Route } from '@angular/router';

export const cartRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./cart-page').then((module) => module.CartPage),
    data: { title: 'Mon panier' },
  },
];

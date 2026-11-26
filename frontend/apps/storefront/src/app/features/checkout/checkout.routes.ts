import { Route } from '@angular/router';

export const checkoutRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./checkout-page').then((module) => module.CheckoutPage),
    data: { title: 'Commander' },
  },
];

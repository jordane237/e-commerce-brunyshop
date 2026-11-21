import { Route } from '@angular/router';
import { ProductDetailStore } from './product-detail.store';

export const productDetailRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./product-detail-page').then((module) => module.ProductDetailPage),
    providers: [ProductDetailStore],
    data: { title: 'Fiche produit' },
  },
];

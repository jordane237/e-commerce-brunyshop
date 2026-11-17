import { Route } from '@angular/router';

export const PRODUCTS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./products-list/products-list.component').then((m) => m.ProductsListComponent),
    data: { title: 'Produits', breadcrumb: 'Produits' },
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
    data: { title: 'Nouveau produit', breadcrumb: 'Nouveau produit' },
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('../shared/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
    data: { title: 'Modifier le produit', breadcrumb: 'Modifier le produit' },
  },
];

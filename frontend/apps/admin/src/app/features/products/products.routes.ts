import { Route } from '@angular/router';

import { PendingChangesGuard } from './product-form/pending-changes.guard';

export const PRODUCTS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./products-list/products-list.component').then((m) => m.ProductsListComponent),
    data: { title: 'Produits', breadcrumb: 'Produits' },
  },
  {
    path: 'nouveau',
    canDeactivate: [PendingChangesGuard],
    loadComponent: () =>
      import('./product-form/product-form.component').then((m) => m.ProductFormComponent),
    data: { title: 'Nouveau produit', breadcrumb: 'Nouveau produit' },
  },
  {
    path: ':id/modifier',
    canDeactivate: [PendingChangesGuard],
    loadComponent: () =>
      import('./product-form/product-form.component').then((m) => m.ProductFormComponent),
    data: { title: 'Modifier le produit', breadcrumb: 'Modifier le produit' },
  },
];

import { Route } from '@angular/router';
import { CatalogStore } from '../catalog/catalog.store';

export const searchRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./search.component').then((module) => module.SearchComponent),
    providers: [CatalogStore],
    data: { title: 'Recherche' },
  },
];

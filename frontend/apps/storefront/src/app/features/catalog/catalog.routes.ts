import { Route } from '@angular/router';
import { CatalogStore } from './catalog.store';

/**
 * Le store est fourni par la route : quitter la boutique détruit l'état et
 * évite de réafficher les produits d'une session précédente au retour.
 */
export const catalogRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./catalog-page').then((module) => module.CatalogPage),
    providers: [CatalogStore],
  },
];

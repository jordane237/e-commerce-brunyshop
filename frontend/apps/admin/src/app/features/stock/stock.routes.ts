import { Route } from '@angular/router';

export const STOCK_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./stock-alerts.component').then((module) => module.StockAlertsComponent),
  },
];

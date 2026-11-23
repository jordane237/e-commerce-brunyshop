import { Route } from '@angular/router';

export const STOCK_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./stock-list/stock-list.component').then((m) => m.StockListComponent),
    data: { title: 'Stock', breadcrumb: 'Stock' },
  },
  {
    path: 'alertes',
    loadComponent: () => import('./stock-alerts.component').then((m) => m.StockAlertsComponent),
    data: { title: 'Alertes de stock', breadcrumb: 'Alertes' },
  },
];

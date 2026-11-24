import { Routes } from '@angular/router';

import { OrderTrackingComponent } from './order-tracking.component';

export const ORDER_TRACKING_ROUTES: Routes = [
  {
    path: '',
    component: OrderTrackingComponent,
    data: { title: 'Suivre ma commande' },
  },
];

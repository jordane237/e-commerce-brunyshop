import { Route } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from '@bruny/core';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { ADMIN_PROFILE_ITEM, navRoles } from './layout/navigation/nav-items.config';

export const appRoutes: Route[] = [
  {
    path: 'connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'acces-refuse',
    loadComponent: () =>
      import('./features/forbidden/forbidden-page').then((module) => module.ForbiddenPage),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [roleGuard(navRoles('dashboard'))],
        data: { title: 'Tableau de bord', breadcrumb: 'Tableau de bord' },
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((module) => module.DASHBOARD_ROUTES),
      },
      {
        path: 'produits',
        canActivate: [roleGuard(navRoles('products'))],
        data: { title: 'Produits', breadcrumb: 'Produits' },
        loadChildren: () =>
          import('./features/products/products.routes').then((module) => module.PRODUCTS_ROUTES),
      },
      {
        path: 'stock',
        canActivate: [roleGuard(navRoles('stock'))],
        data: { title: 'Stock', breadcrumb: 'Stock' },
        loadChildren: () =>
          import('./features/stock/stock.routes').then((module) => module.STOCK_ROUTES),
      },
      {
        path: 'commandes',
        canActivate: [roleGuard(navRoles('orders'))],
        data: { title: 'Commandes', breadcrumb: 'Commandes' },
        loadChildren: () =>
          import('./features/orders/orders.routes').then((module) => module.ORDERS_ROUTES),
      },
      {
        path: 'livraisons',
        loadChildren: () =>
          import('./features/shipments/shipments.routes').then((module) => module.SHIPMENTS_ROUTES),
      },
      {
        path: 'clients',
        canActivate: [roleGuard(navRoles('customers'))],
        data: { title: 'Clients', breadcrumb: 'Clients' },
        loadChildren: () =>
          import('./features/customers/customers.routes').then((module) => module.CUSTOMERS_ROUTES),
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard(navRoles('users'))],
        data: { title: 'Utilisateurs', breadcrumb: 'Utilisateurs' },
        loadChildren: () =>
          import('./features/users/users.routes').then((module) => module.USERS_ROUTES),
      },
      {
        path: 'promotions',
        canActivate: [roleGuard(navRoles('promotions'))],
        data: { title: 'Promotions', breadcrumb: 'Promotions' },
        loadChildren: () =>
          import('./features/promotions/promotions.routes').then(
            (module) => module.PROMOTIONS_ROUTES,
          ),
      },
      {
        path: 'avis',
        canActivate: [roleGuard(navRoles('reviews'))],
        data: { title: 'Avis', breadcrumb: 'Avis' },
        loadChildren: () =>
          import('./features/reviews/reviews.routes').then((module) => module.REVIEWS_ROUTES),
      },
      {
        path: 'parametres',
        canActivate: [roleGuard(navRoles('settings'))],
        data: { title: 'Paramètres', breadcrumb: 'Paramètres' },
        loadChildren: () =>
          import('./features/settings/settings.routes').then((module) => module.SETTINGS_ROUTES),
      },
      {
        path: 'audit',
        canActivate: [roleGuard(navRoles('audit'))],
        data: { title: 'Audit', breadcrumb: 'Audit' },
        loadChildren: () =>
          import('./features/audit/audit.routes').then((module) => module.AUDIT_ROUTES),
      },
      {
        path: 'profil',
        canActivate: [roleGuard(ADMIN_PROFILE_ITEM.roles)],
        data: { title: 'Mon profil', breadcrumb: 'Mon profil' },
        loadChildren: () =>
          import('./features/profile/profile.routes').then((module) => module.PROFILE_ROUTES),
      },
      { path: '**', redirectTo: 'acces-refuse' },
    ],
  },
  { path: '**', redirectTo: 'acces-refuse' },
];

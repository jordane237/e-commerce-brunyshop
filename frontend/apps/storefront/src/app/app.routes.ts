import { Route } from '@angular/router';
import { authGuard, guestGuard } from '@bruny/core';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./features/home/home.routes').then((module) => module.homeRoutes),
  },
  {
    path: 'boutique',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then((module) => module.catalogRoutes),
  },
  {
    path: 'recherche',
    loadChildren: () =>
      import('./features/search/search.routes').then((module) => module.searchRoutes),
    data: { title: 'Recherche' },
  },
  {
    path: 'produit/:slug',
    loadChildren: () =>
      import('./features/product-detail/product-detail.routes').then(
        (module) => module.productDetailRoutes,
      ),
  },
  {
    path: 'panier',
    loadChildren: () => import('./features/cart/cart.routes').then((module) => module.cartRoutes),
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((module) => module.LoginComponent),
    canActivate: [guestGuard],
    data: { title: 'Se connecter' },
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
    canActivate: [guestGuard],
    data: { title: 'Créer un compte' },
  },
  {
    path: 'compte',
    loadComponent: () =>
      import('./features/account/account-page').then((module) => module.AccountPage),
    canActivate: [authGuard],
    data: { title: 'Mon compte' },
  },
  {
    path: 'design-system',
    loadComponent: () =>
      import('./features/design-system/design-system-page').then(
        (module) => module.DesignSystemPage,
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then((module) => module.ContactComponent),
    data: { title: 'Contact' },
  },
  {
    path: 'a-propos',
    loadComponent: () =>
      import('./features/info/about/about.component').then((module) => module.AboutComponent),
    data: { title: 'À propos' },
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./features/info/faq/faq.component').then((module) => module.FaqComponent),
    data: { title: 'Questions fréquentes' },
  },
  {
    path: 'livraison',
    loadComponent: () =>
      import('./features/info/delivery/delivery.component').then(
        (module) => module.DeliveryComponent,
      ),
    data: { title: 'Livraison' },
  },
  {
    path: 'retours',
    loadComponent: () =>
      import('./features/info/returns/returns.component').then((module) => module.ReturnsComponent),
    data: { title: 'Retours et échanges' },
  },
  {
    path: 'guide-des-tailles',
    loadComponent: () =>
      import('./features/info/size-guide/size-guide.component').then(
        (module) => module.SizeGuideComponent,
      ),
    data: { title: 'Guide des tailles' },
  },
  {
    path: 'cgv',
    loadComponent: () =>
      import('./features/legal/cgv/cgv.component').then((module) => module.CgvComponent),
    data: { title: 'Conditions générales de vente' },
  },
  {
    path: 'politique-confidentialite',
    loadComponent: () =>
      import('./features/legal/privacy/privacy.component').then(
        (module) => module.PrivacyComponent,
      ),
    data: { title: 'Politique de confidentialité' },
  },
  {
    path: 'confidentialite',
    redirectTo: 'politique-confidentialite',
    pathMatch: 'full',
  },
  {
    path: 'mentions-legales',
    loadComponent: () =>
      import('./features/legal/legal-notice/legal-notice.component').then(
        (module) => module.LegalNoticeComponent,
      ),
    data: { title: 'Mentions légales' },
  },
  { path: '**', redirectTo: 'boutique' },
];

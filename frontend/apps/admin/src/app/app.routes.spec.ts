import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  AUTH_FORBIDDEN_PATH,
  AUTH_HOME_PATH,
  AUTH_LOGIN_PATH,
  AuthService,
  SessionService,
} from '@bruny/core';
import { CatalogApi, PublicConfigService } from '@bruny/data-access';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from './app.routes';
import { adminHomePath } from './features/shared/auth-home';

const facets = {
  categories: [],
  brands: [],
  sizes: [],
  colors: [],
  availability: { inStock: 0, outOfStock: 0 },
  promotion: { active: 0, inactive: 0 },
  price: { min: 0, max: 0 },
};

const catalogApi = {
  list: () =>
    of({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      facets,
    }),
  categories: () => of([]),
};

async function setup(roles?: string[], url = '/produits') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes),
      { provide: AUTH_LOGIN_PATH, useValue: '/connexion' },
      { provide: AUTH_FORBIDDEN_PATH, useValue: '/acces-refuse' },
      {
        provide: AUTH_HOME_PATH,
        useFactory: () => adminHomePath(TestBed.inject(SessionService)),
      },
      { provide: AuthService, useValue: { logout: vi.fn(() => of({ ok: true })) } },
      { provide: CatalogApi, useValue: catalogApi },
      {
        provide: PublicConfigService,
        useValue: { getConfig: () => of({ turnstileEnabled: false, turnstileSiteKey: null }) },
      },
    ],
  });

  if (roles) {
    TestBed.inject(SessionService).setSession('access-token', {
      id: '1',
      email: 'staff@bruny.cm',
      phone: null,
      firstName: 'Awa',
      lastName: 'N.',
      status: 'ACTIVE',
      roles,
    });
  }

  const harness = await RouterTestingHarness.create(url);
  await harness.fixture.whenStable();
  return { harness, router: TestBed.inject(Router) };
}

describe('admin routes', () => {
  it('redirects an anonymous visitor to login with a return URL', async () => {
    const { router } = await setup(undefined, '/produits');

    expect(router.url).toContain('/connexion');
    expect(router.url).toContain('returnUrl=%2Fproduits');
  });

  it('allows STOCK_MANAGER on products and shows the page title', async () => {
    const { harness, router } = await setup(['STOCK_MANAGER'], '/produits');

    expect(router.url).toBe('/produits');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Produits');
  });

  it('sends STOCK_MANAGER to 403 on audit', async () => {
    const { harness, router } = await setup(['STOCK_MANAGER'], '/audit');

    expect(router.url).toBe('/acces-refuse');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Accès refusé');
  });

  it('sends CUSTOMER to 403 on an admin route', async () => {
    const { router } = await setup(['CUSTOMER'], '/produits');

    expect(router.url).toBe('/acces-refuse');
  });

  it('redirects an authenticated user away from login to the dashboard', async () => {
    const { router } = await setup(['ADMIN'], '/connexion');

    expect(router.url).toBe('/');
  });

  it('redirects a LIVREUR from login to Mes livraisons', async () => {
    const { router } = await setup(['LIVREUR'], '/connexion');

    expect(router.url).toBe('/livraisons/mes-livraisons');
  });

  it('renders Mes livraisons for a LIVREUR and blocks Livraisons', async () => {
    const { harness, router } = await setup(['LIVREUR'], '/livraisons/mes-livraisons');

    expect(router.url).toBe('/livraisons/mes-livraisons');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Mes livraisons du jour',
    );

    await harness.navigateByUrl('/livraisons');

    expect(router.url).toBe('/acces-refuse');
  });
});

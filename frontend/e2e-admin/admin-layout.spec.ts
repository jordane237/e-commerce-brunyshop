import { expect, test, type Page } from '@playwright/test';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ORDER_MANAGER' | 'STOCK_MANAGER' | 'LIVREUR' | 'CUSTOMER';

const FACETS = {
  categories: [],
  brands: [],
  sizes: [],
  colors: [],
  availability: { inStock: 0, outOfStock: 0 },
  promotion: { active: 0, inactive: 0 },
  price: { min: 0, max: 0 },
};

const PRODUCTS = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  facets: FACETS,
};

function user(roles: Role[]) {
  return {
    id: 'e2e-user',
    email: 'staff@bruny.test',
    phone: null,
    firstName: 'Awa',
    lastName: 'N.',
    status: 'ACTIVE',
    roles,
  };
}

interface SessionMock {
  expired: boolean;
}

/**
 * Simule la session au boot (refresh + /me) et les appels produits.
 * Aucun compte réel n'est créé : les rôles viennent du mock HTTP.
 */
async function mockSession(page: Page, roles: Role[]): Promise<SessionMock> {
  const state: SessionMock = { expired: false };

  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill(
      state.expired
        ? { status: 401, contentType: 'application/json', body: '{"code":"UNAUTHORIZED"}' }
        : {
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ accessToken: 'e2e-access-token' }),
          },
    ),
  );
  await page.route('**/api/v1/me', (route) =>
    route.fulfill(
      state.expired
        ? { status: 401, contentType: 'application/json', body: '{"code":"UNAUTHORIZED"}' }
        : { status: 200, contentType: 'application/json', body: JSON.stringify(user(roles)) },
    ),
  );
  await page.route('**/api/v1/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  await page.route('**/api/v1/config', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ turnstileEnabled: false, turnstileSiteKey: null }),
    }),
  );
  await page.route('**/api/v1/products*', (route) =>
    route.fulfill(
      state.expired
        ? { status: 401, contentType: 'application/json', body: '{"code":"UNAUTHORIZED"}' }
        : { status: 200, contentType: 'application/json', body: JSON.stringify(PRODUCTS) },
    ),
  );

  return state;
}

async function openAdmin(page: Page, path = '/', roles: Role[] = ['SUPER_ADMIN']) {
  const state = await mockSession(page, roles);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  return state;
}

test.describe('Administration desktop', () => {
  test('redirige un visiteur non authentifié vers la connexion', async ({ page }) => {
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
    );
    await page.route('**/api/v1/config', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ turnstileEnabled: false, turnstileSiteKey: null }),
      }),
    );

    await page.goto('/produits');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/connexion\?returnUrl=%2Fproduits/);
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  });

  test('affiche tous les modules au SUPER_ADMIN', async ({ page }) => {
    await openAdmin(page);

    await expect(page.getByRole('heading', { name: 'Tableau de bord', level: 1 })).toBeVisible();
    const sidebar = page.locator('.sidebar');
    await expect(sidebar.getByRole('link', { name: 'Produits' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Commandes' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Utilisateurs' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Audit' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Paramètres' })).toBeVisible();
  });

  test('filtre le menu du STOCK_MANAGER', async ({ page }) => {
    await openAdmin(page, '/produits', ['STOCK_MANAGER']);

    const sidebar = page.locator('.sidebar');
    await expect(sidebar.getByRole('link', { name: 'Tableau de bord' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Produits' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Stock' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Audit' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Paramètres' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Commandes' })).toHaveCount(0);
  });

  test('redirige STOCK_MANAGER vers 403 sur /audit', async ({ page }) => {
    await openAdmin(page, '/audit', ['STOCK_MANAGER']);

    await expect(page).toHaveURL(/\/acces-refuse$/);
    await expect(page.getByRole('heading', { name: 'Accès refusé', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Retour au tableau de bord' })).toBeVisible();
  });

  test('filtre le menu de l’ORDER_MANAGER', async ({ page }) => {
    await openAdmin(page, '/commandes', ['ORDER_MANAGER']);

    const sidebar = page.locator('.sidebar');
    await expect(sidebar.getByRole('link', { name: 'Commandes' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Livraisons' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Clients' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Produits' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Audit' })).toHaveCount(0);
  });

  test('ne montre que Mes livraisons au LIVREUR', async ({ page }) => {
    await openAdmin(page, '/livraisons/mes-livraisons', ['LIVREUR']);

    await expect(
      page.getByRole('heading', { name: 'Mes livraisons du jour', level: 1 }),
    ).toBeVisible();
    const sidebar = page.locator('.sidebar');
    await expect(sidebar.getByRole('link', { name: 'Mes livraisons' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Tableau de bord' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Commandes' })).toHaveCount(0);
  });

  test('replie la sidebar et persiste le choix après rechargement', async ({ page }) => {
    await openAdmin(page);

    await page.locator('.sidebar__toggle').click();
    await expect(page.locator('.admin-layout')).toHaveClass(/admin-layout--collapsed/);
    expect(await page.evaluate(() => localStorage.getItem('admin-sidebar-collapsed'))).toBe('true');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.admin-layout')).toHaveClass(/admin-layout--collapsed/);
  });

  test('affiche le fil d’Ariane et le titre de la page produits', async ({ page }) => {
    await openAdmin(page, '/produits', ['ADMIN']);

    await expect(
      page.locator('bruny-page-title').getByRole('heading', { name: 'Produits', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: "Fil d'Ariane" })).toContainText('Accueil');
    await expect(page.getByRole('navigation', { name: "Fil d'Ariane" })).toContainText('Produits');
    await expect(page.locator('[aria-current="page"]').last()).toContainText('Produits');
  });

  test('ouvre le menu utilisateur et navigue vers le profil', async ({ page }) => {
    await openAdmin(page);

    await page.locator('.user-menu__trigger').click();
    await expect(page.getByRole('menu', { name: 'Menu utilisateur' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Mon profil' }).click();

    await expect(page).toHaveURL(/\/profil$/);
    await expect(page.getByRole('heading', { name: 'Mon profil', level: 1 })).toBeVisible();
  });

  test('ferme le menu utilisateur avec Échap', async ({ page }) => {
    await openAdmin(page);

    await page.locator('.user-menu__trigger').click();
    await expect(page.getByRole('menu', { name: 'Menu utilisateur' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Menu utilisateur' })).toHaveCount(0);
  });

  test('déconnecte et revient à la connexion', async ({ page }) => {
    await openAdmin(page);

    await page.locator('.user-menu__trigger').click();
    await page.getByRole('menuitem', { name: 'Déconnexion' }).click();

    await expect(page).toHaveURL(/\/connexion$/);
  });

  test('gère une session expirée avec toast et redirection', async ({ page }) => {
    const state = await openAdmin(page);

    state.expired = true;
    await page.locator('.sidebar').getByRole('link', { name: 'Produits' }).click();

    await expect(page).toHaveURL(/\/connexion/, { timeout: 15_000 });
    await expect(page.getByText('Votre session a expiré. Reconnectez-vous.')).toBeVisible();
  });

  test('affiche le fil d’Ariane du module Audit', async ({ page }) => {
    await openAdmin(page, '/audit', ['ADMIN']);

    await expect(page.getByRole('heading', { name: 'Audit', level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: "Fil d'Ariane" })).toContainText('Audit');
  });

  test('redirige une URL inconnue vers la page 403', async ({ page }) => {
    await openAdmin(page, '/module-inconnu');

    await expect(page).toHaveURL(/\/acces-refuse$/);
    await expect(page.getByRole('heading', { name: 'Accès refusé', level: 1 })).toBeVisible();
  });
});

test.describe('Administration mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('affiche la barre basse, masque la sidebar et navigue', async ({ page }) => {
    await openAdmin(page, '/', ['ADMIN']);

    await expect(page.locator('.admin-layout__sidebar')).toBeHidden();
    const bottomNav = page.getByRole('navigation', { name: 'Navigation mobile' });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Mon profil' })).toBeVisible();

    await bottomNav.getByRole('link', { name: 'Commandes' }).click();
    await expect(page).toHaveURL(/\/commandes$/);
    await expect(page.getByRole('heading', { name: 'Commandes', level: 1 })).toBeVisible();
  });

  test('ouvre et ferme le tiroir complet avec Échap', async ({ page }) => {
    await openAdmin(page, '/', ['ADMIN']);

    await page.locator('.admin-header__menu').click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Audit' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('limite la barre basse du LIVREUR', async ({ page }) => {
    await openAdmin(page, '/livraisons/mes-livraisons', ['LIVREUR']);

    const links = page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link');
    await expect(links).toHaveCount(2);
    await expect(links.first()).toContainText('Mes livraisons');
    await expect(links.last()).toContainText('Mon profil');
  });
});

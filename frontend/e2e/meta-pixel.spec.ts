import { expect, test, type Page } from '@playwright/test';

const SLUG = 'produit-test-mkt04';
const CONSENT_KEY = 'brunyshop.consent.v1';
const UTM_KEY = 'brunyshop.utm.v1';

const product = {
  id: 'product-mkt04',
  slug: SLUG,
  name: 'Mocassin Test MKT-04',
  description: 'Mocassin utilisé pour vérifier les événements Meta.',
  seoTitle: 'Mocassin Test MKT-04 — Bruny',
  seoDescription: 'Mocassin de test MKT-04.',
  basePrice: 25000,
  effectivePrice: 25000,
  promoPrice: null,
  promoStart: null,
  promoEnd: null,
  isPromoActive: false,
  inStock: true,
  category: { id: 'category-test', name: 'Mocassins', slug: 'mocassins' },
  brand: { id: 'brand-test', name: 'Bruny', slug: 'bruny', logo: null },
  images: [
    {
      id: 'img-1',
      url: 'https://placehold.co/800x800?text=MKT04+1',
      alt: 'Vue 1',
      position: 0,
      variantColor: null,
    },
    {
      id: 'img-2',
      url: 'https://placehold.co/800x800?text=MKT04+2',
      alt: 'Vue 2',
      position: 1,
      variantColor: null,
    },
  ],
  colors: [
    {
      color: 'NOIR',
      slug: 'noir',
      images: [
        {
          id: 'img-noir-1',
          url: 'https://placehold.co/800x800?text=MKT04+1',
          alt: 'Vue 1',
          position: 0,
          variantColor: 'NOIR',
        },
      ],
      availableSizes: ['41'],
      hasStock: true,
    },
  ],
  sizes: [{ size: '41', availableStock: 2, isAvailable: true, isLowStock: true }],
  variants: [
    {
      id: 'variant-41',
      sku: 'SKU-MKT04-41',
      size: '41',
      color: 'NOIR',
      effectivePrice: 25000,
      availableStock: 2,
      isAvailable: true,
    },
  ],
  similarProducts: [],
};

function consentPreferences(marketing = true) {
  return {
    necessary: true,
    analytics: false,
    marketing,
    version: '1.0',
    updatedAt: new Date().toISOString(),
  };
}

async function installPixelStub(page: Page, accepted = true): Promise<void> {
  await page.addInitScript((preferences) => {
    localStorage.setItem('brunyshop.consent.v1', JSON.stringify(preferences));
    const testWindow = window as unknown as {
      __fbqCalls?: unknown[][];
      __BRUNY_META_PIXEL_ID__?: string;
      fbq?: (...args: unknown[]) => void;
    };
    testWindow.__BRUNY_META_PIXEL_ID__ = '123456789012345';
    testWindow.__fbqCalls = [];
    testWindow.fbq = (...args: unknown[]): void => {
      testWindow.__fbqCalls?.push(args);
    };
  }, consentPreferences(accepted));
}

async function events(page: Page): Promise<{ name: unknown; params: unknown }[]> {
  return page.evaluate(() => {
    const testWindow = window as unknown as { __fbqCalls?: unknown[][] };
    return (testWindow.__fbqCalls ?? []).map((call) => ({
      name: call[1],
      params: call[2],
    }));
  });
}

async function openProduct(page: Page): Promise<void> {
  await page.route(`**/api/v1/products/${SLUG}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(product),
    });
  });
  await page.goto(`/produit/${SLUG}`);
  await expect(page.getByRole('heading', { name: 'Mocassin Test MKT-04' })).toBeVisible({
    timeout: 20_000,
  });
}

test.describe('Consentement et Pixel Meta', () => {
  test('affiche le bandeau sans charger le Pixel au premier accès', async ({ page }) => {
    await page.goto('/politique-confidentialite');

    await expect(
      page.getByRole('region', { name: 'Nous respectons votre vie privée' }),
    ).toBeVisible();
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
  });

  test('refuse les traceurs et mémorise le choix', async ({ page }) => {
    await page.goto('/politique-confidentialite');
    await page.getByRole('button', { name: 'Refuser' }).click();

    await expect(
      page.getByRole('region', { name: 'Nous respectons votre vie privée' }),
    ).toBeHidden();
    const stored = await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);
    expect(JSON.parse(stored ?? '{}')).toMatchObject({ analytics: false, marketing: false });
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
  });

  test('accepte les traceurs, charge le Pixel et envoie PageView', async ({ page }) => {
    await page.addInitScript(() => {
      const testWindow = window as unknown as {
        __fbqCalls?: unknown[][];
        __BRUNY_META_PIXEL_ID__?: string;
        fbq?: (...args: unknown[]) => void;
      };
      testWindow.__BRUNY_META_PIXEL_ID__ = '123456789012345';
      testWindow.__fbqCalls = [];
      testWindow.fbq = (...args: unknown[]): void => {
        testWindow.__fbqCalls?.push(args);
      };
    });
    await page.goto('/politique-confidentialite');
    await page.getByRole('button', { name: 'Accepter' }).click();

    await expect
      .poll(async () => (await events(page)).map((entry) => entry.name))
      .toContain('PageView');
    const stored = await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);
    expect(JSON.parse(stored ?? '{}')).toMatchObject({ analytics: true, marketing: true });
  });

  test('envoie ViewContent sur la fiche produit', async ({ page }) => {
    await installPixelStub(page);
    await openProduct(page);

    await expect
      .poll(async () => (await events(page)).map((entry) => entry.name))
      .toContain('ViewContent');
    const viewContent = (await events(page)).find((entry) => entry.name === 'ViewContent');
    expect(viewContent?.params).toMatchObject({
      content_ids: ['SKU-MKT04-41'],
      currency: 'XAF',
      value: 25000,
    });
  });

  test('envoie AddToCart après un ajout réussi', async ({ page }) => {
    await installPixelStub(page);
    await openProduct(page);

    await page.getByRole('radio', { name: /Pointure 41/ }).click();
    await page.locator('.product-detail__buy button').click();

    await expect
      .poll(async () => (await events(page)).map((entry) => entry.name))
      .toContain('AddToCart');
    const addToCart = (await events(page)).find((entry) => entry.name === 'AddToCart');
    expect(addToCart?.params).toMatchObject({
      content_ids: ['SKU-MKT04-41'],
      currency: 'XAF',
      value: 25000,
      num_items: 1,
    });
  });

  test('conserve les UTM jusqu’à la commande', async ({ page }) => {
    await installPixelStub(page);
    await page.goto(
      '/politique-confidentialite?utm_source=facebook&utm_medium=cpc&utm_campaign=soldes-2026',
    );

    await expect
      .poll(async () => {
        const stored = await page.evaluate((key) => localStorage.getItem(key), UTM_KEY);
        return JSON.parse(stored ?? '{}') as Record<string, unknown>;
      })
      .toMatchObject({
        source: 'facebook',
        medium: 'cpc',
        campaign: 'soldes-2026',
      });
  });

  test('permet de retirer le consentement depuis le footer', async ({ page }) => {
    await installPixelStub(page);
    await page.context().addCookies([{ name: '_fbp', value: 'abc', url: 'http://127.0.0.1:4200' }]);
    await page.goto('/politique-confidentialite');

    await page.getByRole('button', { name: 'Gérer mes préférences cookies' }).click();
    await page.getByRole('button', { name: 'Personnaliser' }).click();
    const dialog = page.getByRole('dialog', { name: 'Gérer mes préférences' });
    await expect(dialog).toBeVisible();
    await page.getByText('Publicité (Pixel Meta)', { exact: true }).click();
    await expect(page.locator('input[name="consent-marketing"]')).not.toBeChecked();
    await page.getByRole('button', { name: 'Enregistrer mes choix' }).click();

    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => {
        const stored = await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);
        return JSON.parse(stored ?? '{}') as { marketing?: boolean };
      })
      .toMatchObject({ marketing: false });
    await expect
      .poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === '_fbp'))
      .toBe(false);
  });

  test('ferme les préférences avec Échap et laisse le bandeau accessible', async ({ page }) => {
    await installPixelStub(page);
    await page.goto('/politique-confidentialite');
    await page.getByRole('button', { name: 'Gérer mes préférences cookies' }).click();
    await page.getByRole('button', { name: 'Personnaliser' }).click();

    const dialog = page.getByRole('dialog', { name: 'Gérer mes préférences' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('region', { name: 'Nous respectons votre vie privée' }),
    ).toBeVisible();
  });

  test('ne rend ni bandeau ni script Pixel au SSR', async ({ request }) => {
    const response = await request.get('/politique-confidentialite');

    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).not.toContain('Nous respectons votre vie privée');
    expect(html).not.toContain('connect.facebook.net');
  });
});

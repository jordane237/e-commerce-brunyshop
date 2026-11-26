import { expect, test, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

const CONSENT_KEY = 'brunyshop.consent.v1';
const FAB = 'a.whatsapp-fab';
const PHONE = '237679176296';
const PRODUCT_SLUG = 'produit-test-mkt06';

const product = {
  id: 'product-mkt06',
  slug: PRODUCT_SLUG,
  name: 'Mocassin Test MKT-06',
  description: 'Mocassin utilisé pour vérifier le bouton WhatsApp flottant.',
  seoTitle: 'Mocassin Test MKT-06 — Bruny',
  seoDescription: 'Mocassin de test MKT-06.',
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
      url: 'https://placehold.co/800x800?text=MKT06',
      alt: 'Vue 1',
      position: 0,
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
          url: 'https://placehold.co/800x800?text=MKT06+Noir',
          alt: 'Vue noir',
          position: 0,
          variantColor: 'NOIR',
        },
      ],
      availableSizes: ['41'],
      hasStock: true,
    },
  ],
  sizes: [{ size: '41', availableStock: 4, isAvailable: true, isLowStock: true }],
  variants: [
    {
      id: 'variant-41',
      sku: 'SKU-MKT06-41',
      size: '41',
      color: 'NOIR',
      effectivePrice: 25000,
      availableStock: 4,
      isAvailable: true,
    },
  ],
  similarProducts: [],
};

async function seedConsent(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        version: '1.0',
        updatedAt: new Date().toISOString(),
      }),
    );
  }, CONSENT_KEY);
}

async function mockProduct(page: Page): Promise<void> {
  await page.route(`**/api/v1/products/${PRODUCT_SLUG}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(product),
    });
  });
}

async function open(page: Page, path: string): Promise<Locator> {
  await seedConsent(page);
  await page.goto(path);
  await waitForHydration(page);
  const fab = page.locator(FAB);
  await expect(fab).toBeVisible({ timeout: 20_000 });
  return fab;
}

function messageOf(href: string | null): string {
  expect(href).not.toBeNull();
  return new URL(href as string).searchParams.get('text') ?? '';
}

test.describe('FAB WhatsApp', () => {
  test('affiche le lien contextuel sur l’accueil', async ({ page }) => {
    const fab = await open(page, '/');

    expect(await fab.getAttribute('href')).toContain(`https://wa.me/${PHONE}?text=`);
    expect(messageOf(await fab.getAttribute('href'))).toContain('je visite votre boutique');
  });

  test('affiche le lien contextuel sur la boutique', async ({ page }) => {
    const fab = await open(page, '/boutique');

    expect(messageOf(await fab.getAttribute('href'))).toContain('je parcours votre boutique');
  });

  test('affiche le lien contextuel sur le panier', async ({ page }) => {
    const fab = await open(page, '/panier');

    expect(messageOf(await fab.getAttribute('href'))).toContain('mon panier');
  });

  test('affiche le FAB sur le guide des pointures', async ({ page }) => {
    await open(page, '/guide-des-tailles');
  });

  test('affiche le FAB sur une page légale', async ({ page }) => {
    await open(page, '/politique-confidentialite');
  });

  test('masque le FAB sur la page contact', async ({ page }) => {
    await seedConsent(page);
    await page.goto('/contact');

    await expect(page.getByRole('heading', { name: 'Contactez-nous' })).toBeVisible();
    await expect(page.locator(FAB)).toHaveCount(0);
  });

  test('masque le FAB pendant le consentement puis le réaffiche', async ({ page }) => {
    await page.goto('/politique-confidentialite');

    const banner = page.getByRole('region', { name: 'Nous respectons votre vie privée' });
    await expect(banner).toBeVisible();
    await expect(page.locator(FAB)).toHaveCount(0);

    await page.getByRole('button', { name: 'Accepter' }).click();
    await expect(banner).toBeHidden();
    await expect(page.locator(FAB)).toBeVisible();
  });

  test('affiche le FAB sur P04 desktop', async ({ page }) => {
    await seedConsent(page);
    await mockProduct(page);
    await page.goto(`/produit/${PRODUCT_SLUG}`);

    await expect(page.getByRole('heading', { level: 1, name: 'Mocassin Test MKT-06' })).toBeVisible(
      { timeout: 20_000 },
    );
    await expect(page.locator(FAB)).toBeVisible();
  });

  test('expose les attributs d’accessibilité, l’infobulle et la cible de 56 px', async ({
    page,
  }) => {
    const fab = await open(page, '/');

    await expect(fab).toHaveAttribute('target', '_blank');
    await expect(fab).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(fab).toHaveAttribute(
      'aria-label',
      'Contacter le support sur WhatsApp (nouvel onglet)',
    );

    const tooltip = page.locator('#whatsapp-fab-tooltip');
    await expect(tooltip).toHaveRole('tooltip');
    await expect(tooltip).toContainText('Discuter sur WhatsApp');

    await fab.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(fab).toBeFocused();
    await expect(tooltip).toHaveCSS('opacity', '1');

    const box = await fab.boundingBox();
    expect(box?.width).toBe(56);
    expect(box?.height).toBe(56);
    expect(await fab.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  });

  test('utilise une cible de 52 px sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fab = await open(page, '/guide-des-tailles');

    const box = await fab.boundingBox();
    expect(box?.width).toBe(52);
    expect(box?.height).toBe(52);
    expect(box?.x).toBe(390 - 16 - 52);
  });
});

test.describe('FAB WhatsApp sur P04 mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('est masqué lorsque la sticky bar CAT-10 est visible', async ({ page }) => {
    await seedConsent(page);
    await mockProduct(page);
    await page.goto(`/produit/${PRODUCT_SLUG}`);

    await expect(page.getByRole('heading', { level: 1, name: 'Mocassin Test MKT-06' })).toBeVisible(
      { timeout: 20_000 },
    );
    await expect(page.locator('.sticky-buy-bar')).toBeVisible();
    await expect(page.locator(FAB)).toBeHidden();
  });
});

test.describe('SSR du FAB WhatsApp', () => {
  test('rend le lien WhatsApp dans le HTML serveur', async ({ request }) => {
    const response = await request.get('/');

    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain(`https://wa.me/${PHONE}`);
    expect(html).toContain('Contacter le support sur WhatsApp');
  });
});

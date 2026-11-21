import { expect, test, type Page } from '@playwright/test';

const SLUG = 'produit-test-cat11';

function productResponse() {
  return {
    id: 'product-test-cat11',
    slug: SLUG,
    name: 'Mocassin Test CAT-11',
    description: 'Mocassin en cuir véritable pour les tests du guide des tailles.',
    seoTitle: 'Mocassin Test CAT-11 — Bruny',
    seoDescription: 'Mocassin en cuir véritable pour les tests.',
    basePrice: 30000,
    effectivePrice: 25000,
    promoPrice: 25000,
    promoStart: '2026-11-01T00:00:00.000Z',
    promoEnd: '2026-12-01T00:00:00.000Z',
    isPromoActive: true,
    inStock: true,
    category: { id: 'category-test', name: 'Mocassins', slug: 'mocassins' },
    brand: { id: 'brand-test', name: 'Bruny', slug: 'bruny', logo: null },
    images: [
      {
        id: 'img-common',
        url: 'https://placehold.co/800x800?text=Commun',
        alt: 'Vue commune',
        position: 0,
        variantColor: null,
      },
    ],
    colors: [],
    sizes: [{ size: '41', availableStock: 3, isAvailable: true, isLowStock: false }],
    variants: [],
    similarProducts: [],
  };
}

async function mockProduct(page: Page): Promise<void> {
  await page.route(`**/api/v1/products/${SLUG}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(productResponse()),
    });
  });
}

async function mockSizeGuide(page: Page): Promise<void> {
  await page.route('**/api/v1/size-guides/category-test', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'guide-test',
        name: 'Guide',
        slug: 'guide',
        description: null,
        table: {
          men: [{ eu: 42, us: 9, uk: 8, cm: 27 }],
          women: [],
          kids: [],
        },
        version: 1,
        publishedAt: null,
      }),
    });
  });
}

async function openProduct(page: Page): Promise<void> {
  await mockProduct(page);
  await mockSizeGuide(page);
  await page.goto(`/produit/${SLUG}`);
  await expect(page.getByRole('heading', { name: 'Mocassin Test CAT-11' })).toBeVisible({
    timeout: 20_000,
  });
}

test.describe('Guide des tailles et partage CAT-11', () => {
  test('ouvre la modale guide des tailles et la ferme avec Échap', async ({ page }) => {
    await openProduct(page);

    await page.getByRole('button', { name: 'Guide des tailles' }).click();
    const dialog = page.getByRole('dialog', { name: 'Guide des tailles' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('42');
    await expect(dialog).toContainText('Comment mesurer votre pied');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('affiche les boutons de partage', async ({ page }) => {
    await openProduct(page);

    await expect(page.locator('[role="group"][aria-label="Partager ce produit"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Partager sur Facebook/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Partager sur WhatsApp/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copier le lien/ })).toBeVisible();
  });
});

test.describe('Open Graph SSR CAT-11', () => {
  test('rend les métadonnées produit côté serveur', async ({ request }) => {
    const response = await request.get('/produit/mocassins-camostride-elegance');
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('property="product:price:amount"');
    expect(html).toContain('property="product:price:currency"');
  });
});

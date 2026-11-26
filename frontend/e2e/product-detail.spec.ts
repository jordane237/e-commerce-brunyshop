import { expect, test, type Page } from '@playwright/test';

const SLUG = 'produit-test-cat10';

function productResponse() {
  return {
    id: 'product-test',
    slug: SLUG,
    name: 'Mocassin Test CAT-10',
    description: 'Mocassin en cuir véritable pour les tests de la fiche produit.',
    seoTitle: 'Mocassin Test CAT-10 — Bruny',
    seoDescription: 'Mocassin en cuir véritable pour les tests.',
    basePrice: 30000,
    effectivePrice: 25000,
    promoPrice: 25000,
    promoStart: '2026-11-01T00:00:00.000Z',
    promoEnd: '2026-12-01T00:00:00.000Z',
    isPromoActive: true,
    discountPercent: 17,
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
    colors: [
      {
        color: 'NOIR',
        slug: 'noir',
        images: [
          {
            id: 'img-noir-1',
            url: 'https://placehold.co/800x800?text=Noir+1',
            alt: 'Mocassin noir vue 1',
            position: 1,
            variantColor: 'NOIR',
          },
          {
            id: 'img-noir-2',
            url: 'https://placehold.co/800x800?text=Noir+2',
            alt: 'Mocassin noir vue 2',
            position: 2,
            variantColor: 'NOIR',
          },
        ],
        availableSizes: ['41', '43'],
        hasStock: true,
      },
      {
        color: 'BLANC',
        slug: 'blanc',
        images: [
          {
            id: 'img-blanc',
            url: 'https://placehold.co/800x800?text=Blanc',
            alt: 'Mocassin blanc',
            position: 3,
            variantColor: 'BLANC',
          },
        ],
        availableSizes: ['41', '43'],
        hasStock: true,
      },
    ],
    sizes: [
      { size: '41', availableStock: 2, isAvailable: true, isLowStock: true },
      { size: '42', availableStock: 0, isAvailable: false, isLowStock: false },
      { size: '43', availableStock: 8, isAvailable: true, isLowStock: false },
    ],
    variants: [
      {
        id: 'variant-noir-41',
        sku: 'SKU-NOIR-41',
        size: '41',
        color: 'NOIR',
        effectivePrice: 25000,
        availableStock: 2,
        isAvailable: true,
      },
      {
        id: 'variant-noir-42',
        sku: 'SKU-NOIR-42',
        size: '42',
        color: 'NOIR',
        effectivePrice: 25000,
        availableStock: 0,
        isAvailable: false,
      },
      {
        id: 'variant-noir-43',
        sku: 'SKU-NOIR-43',
        size: '43',
        color: 'NOIR',
        effectivePrice: 25000,
        availableStock: 8,
        isAvailable: true,
      },
      {
        id: 'variant-blanc-41',
        sku: 'SKU-BLANC-41',
        size: '41',
        color: 'BLANC',
        effectivePrice: 26000,
        availableStock: 1,
        isAvailable: true,
      },
      {
        id: 'variant-blanc-43',
        sku: 'SKU-BLANC-43',
        size: '43',
        color: 'BLANC',
        effectivePrice: 26000,
        availableStock: 5,
        isAvailable: true,
      },
    ],
    similarProducts: [
      {
        id: 'similar-1',
        name: 'Richelieu Test',
        slug: 'richelieu-test',
        basePrice: 28000,
        effectivePrice: 28000,
        promoPrice: null,
        promoStart: null,
        promoEnd: null,
        isPromoActive: false,
        discountPercent: null,
        inStock: true,
        category: { id: 'category-test', name: 'Mocassins', slug: 'mocassins' },
        brand: { id: 'brand-test', name: 'Bruny', slug: 'bruny', logo: null },
        images: [
          {
            id: 'similar-img',
            url: 'https://placehold.co/600x600?text=Similar',
            alt: 'Richelieu Test',
            position: 0,
            variantColor: null,
          },
        ],
      },
    ],
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

async function openProduct(page: Page): Promise<void> {
  await mockProduct(page);
  await page.goto(`/produit/${SLUG}`);
  await expect(page.getByRole('heading', { name: 'Mocassin Test CAT-10' })).toBeVisible({
    timeout: 20_000,
  });
}

test.describe('Fiche produit CAT-10', () => {
  test('affiche la galerie, le prix promo, les sélecteurs, les onglets et les similaires', async ({
    page,
  }) => {
    await openProduct(page);

    await expect(page.locator('app-product-gallery')).toBeVisible();
    await expect(page.locator('.gallery__thumbnail')).toHaveCount(2);
    await expect(page.locator('.product-detail__price')).toContainText('25 000 FCFA');
    await expect(page.locator('.product-detail__price')).toContainText('30 000 FCFA');
    await expect(page.locator('.product-detail__price .bs-badge--promo')).toContainText('17');
    await expect(page.locator('.product-detail__saving')).toContainText('5 000 FCFA');
    await expect(page.getByRole('radio', { name: /Couleur NOIR/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.locator('bruny-tabs')).toBeVisible();
    await expect(page.locator('bruny-product-card')).toHaveCount(1);
  });

  test('change l’image au clic sur une miniature et ouvre le zoom', async ({ page }) => {
    await openProduct(page);
    const main = page.locator('.gallery__main-image');

    await expect(main).toHaveAttribute('src', /Noir\+1/);
    await page.locator('.gallery__thumbnail').nth(1).click();
    await expect(main).toHaveAttribute('src', /Noir\+2/);
    await expect(page.locator('.gallery__thumbnail').nth(1)).toHaveAttribute(
      'aria-current',
      'true',
    );

    await page.locator('.gallery__main-button').click();
    await expect(page.getByRole('dialog', { name: 'Mocassin Test CAT-10' })).toBeVisible();
  });

  test('met à jour la galerie et les pointures quand la couleur change', async ({ page }) => {
    await openProduct(page);
    const main = page.locator('.gallery__main-image');

    await page.getByRole('radio', { name: /Couleur BLANC/ }).click();

    await expect(main).toHaveAttribute('src', /Blanc/);
    await expect(page.getByRole('radio', { name: /Couleur BLANC/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.locator('.product-detail__price')).toContainText('26 000 FCFA');
    await expect(page.getByRole('radio', { name: /Pointure 41/ })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  test('grise et barre les pointures épuisées, affiche « Plus que X en stock »', async ({
    page,
  }) => {
    await openProduct(page);

    const outOfStock = page.getByRole('radio', { name: 'Pointure 42 (indisponible)' });
    await expect(outOfStock).toBeDisabled();
    await expect(outOfStock).toHaveAttribute('aria-disabled', 'true');

    await expect(page.locator('.bs-size-selector__low-stock')).toContainText('Plus que 2 en stock');
  });

  test('désactive le CTA avec un message explicite puis l’active', async ({ page }) => {
    await openProduct(page);
    const cta = page.locator('.product-detail__buy button');

    await expect(cta).toBeDisabled();
    await expect(page.locator('#add-to-cart-help')).toContainText('Sélectionnez une pointure');

    await page.getByRole('radio', { name: /Pointure 41/ }).click();
    await expect(cta).toBeEnabled();
    await expect(page.locator('#add-to-cart-help')).toHaveCount(0);
  });

  test('ajoute au panier et ouvre le mini-panier', async ({ page }) => {
    await openProduct(page);

    await page.getByRole('radio', { name: /Pointure 41/ }).click();
    await page.locator('.product-detail__buy button').click();

    const dialog = page.getByRole('dialog', { name: 'Mon panier' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('.mini-cart__badge')).toHaveText('1');
    await expect(page.getByText('Produit ajouté au panier.')).toBeVisible();
  });

  test('change d’onglet avec les rôles ARIA', async ({ page }) => {
    await openProduct(page);
    const delivery = page.getByRole('tab', { name: 'Livraison' });

    await delivery.click();

    await expect(delivery).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('Douala Centre');
  });

  test('navigue au clavier dans les pointures', async ({ page }) => {
    await openProduct(page);
    const size41 = page.getByRole('radio', { name: /Pointure 41/ });

    await size41.focus();
    await page.keyboard.press('ArrowRight');

    await expect(page.getByRole('radio', { name: /Pointure 43/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('affiche « Produit introuvable » pour un slug inconnu', async ({ page }) => {
    await page.route('**/api/v1/products/produit-inconnu-cat10', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/produit/produit-inconnu-cat10');

    await expect(page.getByRole('heading', { name: 'Produit introuvable' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Découvrir la boutique' })).toBeVisible();
  });

  test('la barre d’achat fixe est masquée sur desktop', async ({ page }) => {
    await openProduct(page);

    await expect(page.locator('.sticky-buy-bar')).toBeHidden();
  });

  test('passe en deux colonnes dès 768 px', async ({ page }) => {
    await openProduct(page);
    await page.setViewportSize({ width: 768, height: 1024 });

    const columns = await page
      .locator('.product-detail__layout')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns);

    expect(columns.split(' ').length).toBe(2);
  });

  test('ouvre une autre fiche depuis les produits similaires', async ({ page }) => {
    const similar = {
      ...productResponse(),
      id: 'similar-1',
      slug: 'richelieu-test',
      name: 'Richelieu Test',
    };
    await page.route('**/api/v1/products/richelieu-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(similar),
      });
    });
    await openProduct(page);

    await page.locator('bruny-product-card a').first().click();

    await expect(page).toHaveURL(/\/produit\/richelieu-test$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Richelieu Test' })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe('Fiche produit mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('affiche la barre d’achat fixe avec le panier et WhatsApp', async ({ page }) => {
    await openProduct(page);
    const bar = page.locator('.sticky-buy-bar');

    await expect(bar).toBeVisible();
    await expect(bar).toContainText('25 000 FCFA');
    await expect(bar).toContainText('Ajouter au panier');

    const whatsapp = bar.locator('.sticky-buy-bar__whatsapp');
    await expect(whatsapp).toHaveAttribute('href', /wa\.me\/237/);
    await expect(whatsapp).toHaveAttribute('target', '_blank');

    await page.getByRole('radio', { name: /Pointure 41/ }).click();
    await expect(bar.locator('button')).toBeEnabled();
  });
});

test.describe('SEO et SSR de la fiche produit', () => {
  test('rend le contenu, les métadonnées et le JSON-LD Product côté serveur', async ({
    request,
  }) => {
    const response = await request.get('/produit/mocassins-camostride-elegance');

    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('Mocassins CamoStride Élégance');
    expect(html).toContain('FCFA');
    expect(html).toMatch(/<title>[^<]*Mocassins CamoStride Élégance/);
    expect(html).toContain('name="description"');
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"priceCurrency":"XAF"');
    expect(html).toContain('https://schema.org/InStock');
  });
});

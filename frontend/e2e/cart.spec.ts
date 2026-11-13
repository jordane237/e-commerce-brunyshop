import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'brunyshop.cart.v1';

interface ValidatePayload {
  items: Array<{ variantId: string; quantity: number; previousUnitPrice?: number }>;
}

function line(variantId = 'variant-e2e') {
  return {
    variantId,
    productId: 'product-e2e',
    productSlug: 'mocassin-e2e',
    productName: 'Mocassin E2E',
    variantSku: 'SKU-E2E',
    size: '42',
    color: 'Noir',
    quantity: 1,
    unitPriceAtAdd: 20000,
    imageUrl: null,
    imageAlt: null,
    addedAt: '2026-11-13T10:00:00.000Z',
  };
}

async function seedCart(page: Page, variantId = 'variant-e2e') {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      lines: [line(variantId)],
      updatedAt: '2026-11-13T10:00:00.000Z',
    }),
  ] as const);
}

function validResponse(payload: ValidatePayload) {
  const items = payload.items.map((item) => ({
    variantId: item.variantId,
    productId: 'product-e2e',
    productName: 'Mocassin E2E',
    variantSku: 'SKU-E2E',
    size: '42',
    color: 'Noir',
    quantity: item.quantity,
    availableStock: 10,
    unitPrice: 25000,
    lineTotal: 25000 * item.quantity,
    issues: [],
  }));
  return {
    valid: true,
    items,
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    discount: 0,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
    issues: [],
    meta: {
      validatedAt: new Date().toISOString(),
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    },
  };
}

test('conserve le panier invité après rechargement et le revalide', async ({ page }) => {
  await page.route('**/api/v1/cart/validate', async (route) => {
    const payload = route.request().postDataJSON() as ValidatePayload;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(validResponse(payload)),
    });
  });

  await page.goto('/boutique');
  await page.waitForLoadState('networkidle');
  const addButton = page.locator('bruny-product-card .bs-button').first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  await expect(page.getByText('Produit ajouté au panier.')).toBeVisible();
  await expect(page.locator('.mini-cart__badge')).toHaveText('1');

  const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(stored).not.toBeNull();
  expect(stored).not.toMatch(/token|authorization|email|address/i);

  await page.reload();
  await expect(page.locator('.mini-cart__badge')).toHaveText('1');

  await page.locator('.mini-cart__trigger').click();
  const dialog = page.getByRole('dialog', { name: 'Mon panier' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.mini-cart__line-info a')).not.toBeEmpty();
  await dialog.getByRole('link', { name: 'Voir le panier' }).click();

  await expect(page).toHaveURL(/\/panier$/);
  await expect(page.getByRole('heading', { name: 'Mon panier' })).toBeVisible();
  await expect(page.locator('.cart-line')).toHaveCount(1);
});

test('affiche le changement de prix dans une bannière persistante', async ({ page }) => {
  await seedCart(page);
  await page.route('**/api/v1/cart/validate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: false,
        items: [
          {
            variantId: 'variant-e2e',
            productId: 'product-e2e',
            productName: 'Mocassin E2E',
            variantSku: 'SKU-E2E',
            size: '42',
            color: 'Noir',
            quantity: 1,
            availableStock: 10,
            unitPrice: 25000,
            lineTotal: 25000,
            issues: [
              {
                code: 'PRICE_CHANGED',
                message: 'Le prix de Mocassin E2E (42, Noir) a changé : 20 000 FCFA → 25 000 FCFA.',
                variantId: 'variant-e2e',
                previousPrice: 20000,
                currentPrice: 25000,
              },
            ],
          },
        ],
        subtotal: 25000,
        discount: 0,
        total: 25000,
        issues: [],
        meta: {
          validatedAt: new Date().toISOString(),
          itemCount: 1,
          totalQuantity: 1,
        },
      }),
    });
  });

  await page.goto('/panier');

  await expect(page.getByRole('heading', { name: 'Votre panier a changé' })).toBeVisible();
  await expect(page.locator('.cart-page__issues')).toContainText('a changé');
  await expect(page.locator('.cart-summary__total')).toContainText('25 000 FCFA');

  const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(stored).toContain('"unitPriceAtAdd":25000');
});

test('retire une ligne en rupture et explique pourquoi', async ({ page }) => {
  await seedCart(page);
  await page.route('**/api/v1/cart/validate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: false,
        items: [
          {
            variantId: 'variant-e2e',
            productId: 'product-e2e',
            productName: 'Mocassin E2E',
            variantSku: 'SKU-E2E',
            size: '42',
            color: 'Noir',
            quantity: 0,
            availableStock: 0,
            unitPrice: 25000,
            lineTotal: 0,
            issues: [
              {
                code: 'OUT_OF_STOCK',
                message: 'Rupture de stock : Mocassin E2E est indisponible.',
                variantId: 'variant-e2e',
              },
            ],
          },
        ],
        subtotal: 0,
        discount: 0,
        total: 0,
        issues: [],
        meta: {
          validatedAt: new Date().toISOString(),
          itemCount: 1,
          totalQuantity: 0,
        },
      }),
    });
  });

  await page.goto('/panier');

  await expect(page.getByRole('heading', { name: 'Votre panier a changé' })).toBeVisible();
  await expect(page.locator('.cart-page__issues')).toContainText('Rupture de stock');
  await expect(page.getByRole('heading', { name: 'Votre panier est vide' })).toBeVisible();
});

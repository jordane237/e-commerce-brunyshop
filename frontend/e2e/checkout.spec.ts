import { expect, test, type Page, type Route } from '@playwright/test';
import { waitForHydration } from './hydration';

const CART_KEY = 'brunyshop.cart.v1';
const CONSENT_KEY = 'brunyshop.consent.v1';

const ZONES = [
  { id: 'zone-douala', name: 'Douala Centre', cities: ['Douala'], fee: 1500, estimatedDays: 1 },
  { id: 'zone-yaounde', name: 'Yaoundé', cities: ['Yaoundé'], fee: 3000, estimatedDays: 3 },
];

const ORDER_RESPONSE = {
  id: 'order-e2e',
  reference: 'BRN-E2E-0001',
  status: 'PENDING_CONFIRMATION',
  paymentStatus: 'PENDING',
  paymentMethod: 'COD',
  subtotal: 20000,
  discount: 0,
  shippingFee: 1500,
  total: 21500,
  createdAt: '2026-11-23T10:00:00.000Z',
};

function cartLine() {
  return {
    variantId: 'variant-e2e',
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
    addedAt: '2026-11-23T10:00:00.000Z',
  };
}

async function seed(page: Page): Promise<void> {
  await page.addInitScript(
    ([cartKey, consentKey, cart, consent]) => {
      localStorage.setItem(cartKey!, cart!);
      localStorage.setItem(consentKey!, consent!);
    },
    [
      CART_KEY,
      CONSENT_KEY,
      JSON.stringify({ version: 1, lines: [cartLine()], updatedAt: '2026-11-23T10:00:00.000Z' }),
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        version: '1.0',
        updatedAt: new Date().toISOString(),
      }),
    ] as const,
  );
}

async function mockApi(page: Page, onOrder?: (route: Route) => Promise<void>): Promise<void> {
  await page.route('**/api/v1/config', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ turnstileEnabled: false, turnstileSiteKey: null }),
    }),
  );

  await page.route('**/api/v1/cart/validate', async (route) => {
    const payload = route.request().postDataJSON() as {
      items: Array<{ variantId: string; quantity: number }>;
    };
    const items = payload.items.map((item) => ({
      variantId: item.variantId,
      productId: 'product-e2e',
      productName: 'Mocassin E2E',
      variantSku: 'SKU-E2E',
      size: '42',
      color: 'Noir',
      quantity: item.quantity,
      availableStock: 10,
      unitPrice: 20000,
      lineTotal: 20000 * item.quantity,
      issues: [],
    }));
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: true,
        items,
        subtotal,
        discount: 0,
        total: subtotal,
        issues: [],
        meta: {
          validatedAt: new Date().toISOString(),
          itemCount: items.length,
          totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        },
      }),
    });
  });

  await page.route('**/api/v1/shipping/zones', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ZONES),
    }),
  );

  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );

  await page.route('**/api/v1/orders', async (route) => {
    if (onOrder !== undefined) {
      await onOrder(route);
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(ORDER_RESPONSE),
    });
  });
}

test('parcours complet : coordonnées, livraison, paiement à la livraison', async ({ page }) => {
  let orderRequest: { headers: Record<string, string>; body: Record<string, unknown> } | null =
    null;

  await seed(page);
  await mockApi(page, async (route) => {
    orderRequest = {
      headers: route.request().headers(),
      body: route.request().postDataJSON() as Record<string, unknown>,
    };
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(ORDER_RESPONSE),
    });
  });

  await page.goto('/commande');
  await waitForHydration(page);

  // Étape 1 — coordonnées
  await expect(page.getByRole('heading', { name: 'Finaliser ma commande' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vos coordonnées' })).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText('Coordonnées');

  await page.getByRole('button', { name: 'Continuer vers la livraison' }).click();
  await expect(page.getByText('Indiquez votre nom complet.')).toBeVisible();
  await expect(page.getByText('Saisissez votre numéro de téléphone.')).toBeVisible();

  await page.getByLabel('Nom complet').fill('Awa Ngo Bell');
  await page.getByLabel('Numéro de téléphone').fill('12345');
  await page.getByLabel('E-mail (facultatif)').fill('pas-un-email');
  await page.getByRole('button', { name: 'Continuer vers la livraison' }).click();
  await expect(page.getByText(/numéro camerounais à 9 chiffres/)).toBeVisible();
  await expect(page.getByText(/e-mail valide/)).toBeVisible();

  await page.getByLabel('Numéro de téléphone').fill('671234567');
  await page.getByLabel('E-mail (facultatif)').fill('');
  await page.getByRole('button', { name: 'Continuer vers la livraison' }).click();

  // Étape 2 — livraison
  await expect(page.getByRole('heading', { name: 'Livraison' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Douala Centre/ })).toBeVisible();
  await expect(page.getByText('1 500 FCFA').first()).toBeVisible();

  await page.getByRole('button', { name: 'Continuer vers le paiement' }).click();
  await expect(page.getByText('Indiquez votre ville.')).toBeVisible();

  await page.getByLabel('Ville').fill('Douala');
  await page.getByLabel('Quartier').fill('Akwa');
  await page.getByLabel('Point de repère').fill('Face à la pharmacie');
  await page.getByRole('radio', { name: /Douala Centre/ }).check();
  await expect(page.getByText('1 500 FCFA').first()).toBeVisible();
  await expect(page.getByText('21 500 FCFA').last()).toBeVisible();

  await page.getByRole('button', { name: 'Continuer vers le paiement' }).click();

  // Étape 3 — paiement
  await expect(page.getByRole('heading', { name: 'Paiement' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Paiement à la livraison/ })).toBeChecked();
  const mobileMoney = page.getByRole('radio', { name: /Mobile Money/ });
  await expect(mobileMoney).toBeDisabled();
  await expect(page.getByText('Bientôt', { exact: true })).toBeVisible();

  await expect(page.locator('[aria-current="step"]')).toContainText('Paiement');

  // CGV obligatoires : aucun appel réseau sans acceptation.
  await page.getByRole('button', { name: 'Confirmer ma commande' }).click();
  await expect(page.getByText('Acceptez les conditions générales pour commander.')).toBeVisible();
  expect(orderRequest).toBeNull();

  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirmer ma commande' }).click();

  // Résultat
  await expect(page.getByRole('heading', { name: /Votre commande est confirmée/ })).toBeVisible();
  await expect(page.getByText('BRN-E2E-0001').first()).toBeVisible();
  await expect(page.getByText('21 500 FCFA')).toBeVisible();

  expect(orderRequest).not.toBeNull();
  const request = orderRequest as {
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
  expect(request.headers['idempotency-key']).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(request.body['paymentMethod']).toBe('COD');
  expect(request.body['deliveryZoneId']).toBe('zone-douala');
  expect(request.body['guestPhone']).toBe('+237671234567');
  expect(request.body['items']).toEqual([{ variantId: 'variant-e2e', quantity: 1 }]);
  expect(request.body).not.toHaveProperty('total');
  expect(request.body).not.toHaveProperty('shippingFee');

  // Le brouillon et le panier sont nettoyés après succès.
  expect(await page.evaluate((key) => localStorage.getItem(key), 'bruny.checkout.v1')).toBeNull();
  const cartSnapshot = await page.evaluate(
    (key) => localStorage.getItem(key) as string | null,
    CART_KEY,
  );
  expect(JSON.parse(cartSnapshot ?? '{"lines":[]}').lines).toEqual([]);
});

test('conserve le brouillon et l’étape après un rechargement', async ({ page }) => {
  await seed(page);
  await mockApi(page);

  await page.goto('/commande');
  await waitForHydration(page);

  await page.getByLabel('Nom complet').fill('Awa Ngo Bell');
  await page.getByLabel('Numéro de téléphone').fill('671234567');
  await page.getByRole('button', { name: 'Continuer vers la livraison' }).click();
  await expect(page.getByRole('heading', { name: 'Livraison' })).toBeVisible();

  await page.getByLabel('Ville').fill('Douala');
  await page.getByLabel('Quartier').fill('Akwa');
  await page.getByLabel('Point de repère').fill('Près du marché');
  await page.reload();
  await waitForHydration(page);

  await expect(page.getByRole('heading', { name: 'Livraison' })).toBeVisible();
  await expect(page.getByLabel('Ville')).toHaveValue('Douala');
  await expect(page.getByLabel('Quartier')).toHaveValue('Akwa');
  await expect(page.getByLabel('Point de repère')).toHaveValue('Près du marché');

  // Retour à l'étape 1 : les coordonnées sont conservées.
  await page.getByRole('button', { name: 'Retour aux coordonnées' }).click();
  await expect(page.getByLabel('Nom complet')).toHaveValue('Awa Ngo Bell');
  await expect(page.getByLabel('Numéro de téléphone')).toHaveValue('671234567');
});

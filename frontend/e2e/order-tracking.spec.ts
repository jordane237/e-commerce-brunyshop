import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

function successResponse() {
  return {
    found: true,
    order: {
      reference: 'BRN-2611-7K3F',
      status: 'SHIPPED',
      statusLabel: 'Expédiée',
      items: [
        {
          name: 'Mocassin Test',
          size: '42',
          color: 'Noir',
          quantity: 1,
          unitPrice: 24500,
          lineTotal: 24500,
        },
      ],
      subtotal: 24500,
      discount: 0,
      shippingFee: 0,
      total: 24500,
      createdAt: '2026-11-10T10:00:00.000Z',
      timeline: [
        {
          status: 'PENDING_CONFIRMATION',
          label: 'En attente de confirmation',
          date: '2026-11-10T10:00:00.000Z',
          isCurrent: false,
          isCompleted: true,
        },
        {
          status: 'CONFIRMED',
          label: 'Confirmée',
          date: '2026-11-10T11:00:00.000Z',
          isCurrent: false,
          isCompleted: true,
        },
        {
          status: 'PREPARING',
          label: 'En préparation',
          date: '2026-11-10T12:00:00.000Z',
          isCurrent: false,
          isCompleted: true,
        },
        {
          status: 'SHIPPED',
          label: 'Expédiée',
          date: '2026-11-10T13:00:00.000Z',
          isCurrent: true,
          isCompleted: false,
        },
        { status: 'DELIVERED', label: 'Livrée', date: null, isCurrent: false, isCompleted: false },
      ],
      shippingCity: 'Douala',
      estimatedDelivery: '2026-11-11T14:00:00.000Z',
    },
  };
}

async function mockTrack(page: Page, body: unknown, status = 200) {
  await page.route('**/api/v1/orders/track', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

test('page /suivi affiche le formulaire', async ({ page }) => {
  await page.goto('/suivi');
  await waitForHydration(page);
  await expect(page.getByLabel('Numéro de commande')).toBeVisible();
  await expect(page.getByLabel('Téléphone')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suivre ma commande' })).toBeVisible();
});

test('CA #1 : soumission valide affiche le résultat et la timeline', async ({ page }) => {
  await mockTrack(page, successResponse());
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('BRN-2611-7K3F');
  await page.getByLabel('Téléphone').fill('+237612345678');
  await page.getByRole('button', { name: 'Suivre ma commande' }).click();
  await expect(page.getByText('BRN-2611-7K3F')).toBeVisible();
  await expect(page.getByRole('status').getByText('Expédiée')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Chronologie de la commande' })).toContainText(
    'Expédiée',
  );
  await expect(page.getByText('Mocassin Test')).toBeVisible();
  await expect(page.getByText('Total', { exact: true })).toBeVisible();
});

test('CA #1 : référence invalide → erreur inline', async ({ page }) => {
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('ABC-123');
  await page.getByLabel('Téléphone').fill('+237612345678');
  await page.getByLabel('Numéro de commande').blur();
  await expect(
    page.getByText('Le numéro de commande doit être au format BRN-XXXX-XXXX.'),
  ).toBeVisible();
});

test('CA #1 : téléphone invalide → erreur inline', async ({ page }) => {
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('BRN-2611-7K3F');
  await page.getByLabel('Téléphone').fill('0612345678');
  await page.getByLabel('Téléphone').blur();
  await expect(page.getByText('Le téléphone doit être au format +237XXXXXXXXX.')).toBeVisible();
});

test('CA #3 : référence inexistante → message neutre', async ({ page }) => {
  await mockTrack(page, { found: false });
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('BRN-9999-XXXX');
  await page.getByLabel('Téléphone').fill('+237612345678');
  await page.getByRole('button', { name: 'Suivre ma commande' }).click();
  await expect(page.getByText('Référence introuvable ou numéro incorrect')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
});

test('CA #3 : téléphone incorrect → même message neutre', async ({ page }) => {
  await mockTrack(page, { found: false });
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('BRN-2611-7K3F');
  await page.getByLabel('Téléphone').fill('+237699999999');
  await page.getByRole('button', { name: 'Suivre ma commande' }).click();
  await expect(page.getByText('Référence introuvable ou numéro incorrect')).toBeVisible();
});

test('CA #2 : bouton WhatsApp contextualisé avec la référence', async ({ page }) => {
  await mockTrack(page, successResponse());
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('BRN-2611-7K3F');
  await page.getByLabel('Téléphone').fill('+237612345678');
  await page.getByRole('button', { name: 'Suivre ma commande' }).click();
  const link = page.getByRole('link', { name: /Besoin d.aide sur la commande/i });
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  expect(href).toContain('wa.me');
  expect(href).toContain('BRN-2611-7K3F');
});

test('CA #4 : commande livrée → bouton Demander un échange visible', async ({ page }) => {
  const delivered = successResponse();
  delivered.order.status = 'DELIVERED';
  delivered.order.statusLabel = 'Livrée';
  await mockTrack(page, delivered);
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('BRN-2611-7K3F');
  await page.getByLabel('Téléphone').fill('+237612345678');
  await page.getByRole('button', { name: 'Suivre ma commande' }).click();
  await expect(page.getByRole('link', { name: 'Demander un échange' })).toBeVisible();
});

test('CA #4 : commande expédiée → pas de bouton échange', async ({ page }) => {
  await mockTrack(page, successResponse());
  await page.goto('/suivi');
  await waitForHydration(page);
  await page.getByLabel('Numéro de commande').fill('BRN-2611-7K3F');
  await page.getByLabel('Téléphone').fill('+237612345678');
  await page.getByRole('button', { name: 'Suivre ma commande' }).click();
  await expect(page.getByRole('link', { name: 'Demander un échange' })).toHaveCount(0);
});

test('pré-remplissage via query params + soumission auto', async ({ page }) => {
  await mockTrack(page, successResponse());
  await page.goto('/suivi?reference=BRN-2611-7K3F&phone=%2B237612345678');
  await waitForHydration(page);
  await expect(page.getByText('BRN-2611-7K3F')).toBeVisible({ timeout: 10000 });
});

test('SEO : meta robots noindex', async ({ page }) => {
  await page.goto('/suivi');
  await waitForHydration(page);
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toContain('noindex');
});

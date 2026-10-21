import { expect, test } from '@playwright/test';

test('browse catalog and open a product detail', async ({ page }) => {
  await page.goto('/boutique');
  await expect(page.getByRole('heading', { name: 'La boutique' })).toBeVisible();
  await expect(page.locator('bruny-product-card').first()).toBeVisible({ timeout: 20_000 });
  await page.locator('bruny-product-card a').first().click();
  await expect(page).toHaveURL(/\/produit\//);
  await expect(page.getByRole('heading', { name: 'Choisissez votre pointure' })).toBeVisible();
});

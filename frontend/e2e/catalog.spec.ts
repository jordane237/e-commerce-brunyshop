import { expect, test, type Page } from '@playwright/test';

const SIDEBAR = '.catalog__sidebar';

async function expectCards(page: Page, count: number): Promise<void> {
  await expect(page.locator('bruny-product-card')).toHaveCount(count, { timeout: 20_000 });
}

function sizeChip(page: Page) {
  return page.locator(SIDEBAR).getByRole('button', { name: /^42/ });
}

/**
 * Attend la fin de l'hydratation SSR avant la première interaction : sans
 * cela, un clic peut tomber sur le HTML statique avant qu'Angular n'écoute.
 */
async function openCatalog(page: Page, path = '/boutique'): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test.describe('Catalogue', () => {
  test('affiche la première page, le compteur et ouvre une fiche produit', async ({ page }) => {
    await openCatalog(page, '/boutique');

    await expect(page.getByRole('heading', { name: 'Boutique', level: 1 })).toBeVisible();
    await expect(page.locator('.heading__count')).toContainText('20 produits');
    await expectCards(page, 12);
    await expect(page.getByRole('navigation', { name: 'Pages du catalogue' })).toBeVisible();

    await page.locator('bruny-product-card a').first().click();
    await expect(page).toHaveURL(/\/produit\//);
    await expect(page.getByRole('heading', { name: 'Choisissez votre pointure' })).toBeVisible();
  });

  test('filtre par catégorie et synchronise l’URL', async ({ page }) => {
    await openCatalog(page, '/boutique');

    await page.locator(`${SIDEBAR} label[for="desktop-category-sneakers"]`).click();

    await expect(page).toHaveURL(/category=sneakers/);
    expect(page.url()).not.toContain('page=1');
    await expectCards(page, 4);
    await expect(page.locator('.heading__count')).toContainText('4 produits');
    await expect(page.getByRole('heading', { name: 'Sneakers', level: 1 })).toBeVisible();
    await expect(page.locator('.active-filters__item button')).toHaveCount(1);
  });

  test('restaure les filtres précédents avec le retour arrière', async ({ page }) => {
    await openCatalog(page, '/boutique?category=sneakers');
    await expectCards(page, 4);

    await sizeChip(page).click();
    await expect(page).toHaveURL(/size=42/);
    await expect(page.locator('.active-filters__item button')).toHaveCount(2);

    await page.goBack();

    await expect(page).not.toHaveURL(/size=42/);
    await expect(page).toHaveURL(/category=sneakers/);
    await expect(page.locator('.active-filters__item button')).toHaveCount(1);
    await expectCards(page, 4);
  });

  test('trie les produits et synchronise l’URL', async ({ page }) => {
    await openCatalog(page, '/boutique');
    await expectCards(page, 12);

    await page.locator('bruny-sort-select select').selectOption('price_asc');

    await expect(page).toHaveURL(/sort=price_asc/);
    await expectCards(page, 12);
    await expect(page.locator('bruny-sort-select select')).toHaveValue('price_asc');
  });

  test('supprime les puces une à une', async ({ page }) => {
    await openCatalog(page, '/boutique?category=sneakers&color=NOIR');
    await expect(page.locator('.active-filters__item button')).toHaveCount(2);

    await page.getByRole('button', { name: 'Supprimer le filtre Sneakers' }).click();
    await expect(page).not.toHaveURL(/category=/);
    await expect(page).toHaveURL(/color=NOIR/);
    await expect(page.locator('.active-filters__item button')).toHaveCount(1);

    await page.getByRole('button', { name: 'Supprimer le filtre Noir' }).click();
    await expect(page).toHaveURL(/\/boutique$/);
    await expect(page.locator('.active-filters')).toHaveCount(0);
    await expectCards(page, 12);
  });

  test('réinitialise tous les filtres depuis les puces', async ({ page }) => {
    await openCatalog(page, '/boutique?category=sneakers&color=NOIR');
    await expect(page.locator('.active-filters__item button')).toHaveCount(2);

    await page.getByRole('button', { name: 'Réinitialiser tout' }).click();

    await expect(page).toHaveURL(/\/boutique$/);
    await expect(page.locator('.active-filters')).toHaveCount(0);
    await expectCards(page, 12);
  });

  test('affiche « Aucun résultat » et réinitialise les filtres', async ({ page }) => {
    await openCatalog(page, '/boutique?size=99');

    await expect(page.getByRole('status')).toContainText('Aucun résultat');
    await expect(page.getByRole('status')).toContainText(
      'Essayez un autre mot-clé ou retirez un filtre.',
    );

    await page
      .getByRole('status')
      .getByRole('button', { name: 'Réinitialiser les filtres' })
      .click();

    await expect(page).toHaveURL(/\/boutique$/);
    await expectCards(page, 12);
  });

  test('pagine avec les numéros sur desktop', async ({ page }) => {
    await openCatalog(page, '/boutique');
    await expectCards(page, 12);

    await page.getByRole('button', { name: 'Page 2' }).click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expectCards(page, 8);
    await expect(page.locator('.heading__count')).toContainText('20 produits');
  });

  test('partage une URL filtrée : mêmes filtres et mêmes résultats', async ({ page }) => {
    await openCatalog(page, '/boutique?category=sneakers&size=42');

    await expect(page.getByRole('heading', { name: 'Sneakers', level: 1 })).toBeVisible();
    await expect(page.locator('.active-filters__item button')).toHaveCount(2);
    await expect(page.locator('#desktop-category-sneakers')).toBeChecked();
    await expect(sizeChip(page)).toHaveAttribute('aria-pressed', 'true');
    await expectCards(page, 4);
  });

  test('la première page filtrée est rendue côté serveur', async ({ request }) => {
    const response = await request.get('/boutique?category=sneakers');

    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('Sneakers CamoStride Pulse');
    expect(html).toContain('Sneakers UrbanStep Air');
    expect(html).toContain('4 produits');
  });
});

test.describe('Catalogue mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('filtre dans le tiroir et confirme avec « Voir les N résultats »', async ({ page }) => {
    await openCatalog(page, '/boutique');
    await expectCards(page, 12);

    await page.getByRole('button', { name: /^Filtres/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    await page.locator('#drawer-category-sneakers').check();
    await expect(dialog.getByRole('button', { name: 'Voir les 4 résultats' })).toBeVisible();

    await page.getByRole('button', { name: 'Voir les 4 résultats' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/category=sneakers/);
    await expectCards(page, 4);
    await expect(page.getByRole('button', { name: /^Filtres \(1\)/ })).toBeVisible();
  });

  test('ferme le tiroir avec Échap et rend le focus au bouton', async ({ page }) => {
    await openCatalog(page, '/boutique');

    const trigger = page.getByRole('button', { name: /^Filtres/ });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('charge la page suivante avec « Voir plus » puis revient en arrière', async ({ page }) => {
    await openCatalog(page, '/boutique');
    await expectCards(page, 12);

    await page.getByRole('button', { name: 'Voir plus' }).click();

    await expect(page).toHaveURL(/page=2/);
    await expectCards(page, 20);

    await page.goBack();

    await expect(page).not.toHaveURL(/page=2/);
    await expectCards(page, 12);
  });
});

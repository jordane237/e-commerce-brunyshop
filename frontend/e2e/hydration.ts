import type { Page } from '@playwright/test';

/**
 * Attend la fin de l'hydratation SSR avant toute interaction. Le marqueur est
 * posé par App après son premier rendu navigateur : cliquer ou lire le HTML
 * serveur avant ce point peut perdre l'événement ou renvoyer un état périmé.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.documentElement.dataset['appHydrated'] === 'true',
    undefined,
    { timeout: 30_000 },
  );
}

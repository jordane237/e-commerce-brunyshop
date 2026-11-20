import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

export const UTM_STORAGE_KEY = 'brunyshop.utm.v1';

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string;
  fbclid?: string;
  capturedAt: string;
}

const PARAMETERS: readonly [keyof Omit<UtmParams, 'capturedAt'>, string, number][] = [
  ['source', 'utm_source', 100],
  ['medium', 'utm_medium', 100],
  ['campaign', 'utm_campaign', 100],
  ['term', 'utm_term', 100],
  ['content', 'utm_content', 100],
  ['gclid', 'gclid', 255],
  ['fbclid', 'fbclid', 255],
];

function clean(value: string | null, maxLength: number): string | undefined {
  if (value === null) return undefined;
  const normalized = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .trim();
  if (normalized === '') return undefined;
  return normalized.slice(0, maxLength);
}

function isUtmParams(value: unknown): value is UtmParams {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record['capturedAt'] !== 'string') return false;
  if (Number.isNaN(Date.parse(record['capturedAt']))) return false;
  return PARAMETERS.every(([key]) => {
    const field = record[key];
    return field === undefined || typeof field === 'string';
  });
}

/**
 * Capture les paramètres d'acquisition au premier atelier marketing.
 *
 * Le choix est volontairement « first-touch » : les navigations internes ne
 * remplacent pas le premier jeu d'UTM non vide, conformément à MKT-04.
 */
@Injectable({ providedIn: 'root' })
export class UtmService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);

  captureFromUrl(): void {
    if (!this.browser) return;
    if (this.getUtms() !== null) return;

    const params = new URLSearchParams(window.location.search);
    const utms: UtmParams = { capturedAt: new Date().toISOString() };

    for (const [key, queryName, maxLength] of PARAMETERS) {
      const value = clean(params.get(queryName), maxLength);
      if (value !== undefined) utms[key] = value;
    }

    if (Object.keys(utms).length === 1) return;
    this.save(utms);
  }

  getUtms(): UtmParams | null {
    if (!this.browser) return null;
    try {
      const raw = localStorage.getItem(UTM_STORAGE_KEY);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isUtmParams(parsed)) {
        localStorage.removeItem(UTM_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /** Enrichit le corps de `POST /orders` avec le contexte d'acquisition. */
  enrichOrderBody<T extends Record<string, unknown>>(body: T): T & { source?: UtmParams } {
    const utms = this.getUtms();
    if (utms === null) return body;
    return { ...body, source: utms };
  }

  private save(utms: UtmParams): void {
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utms));
    } catch {
      // Stockage indisponible : la commande reste possible sans attribution.
    }
  }
}

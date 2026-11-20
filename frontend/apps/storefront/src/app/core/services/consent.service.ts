import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export const CONSENT_STORAGE_KEY = 'brunyshop.consent.v1';
export const CURRENT_CONSENT_VERSION = '1.0';

/** Durée de validité du choix avant de le redemander (13 mois). */
const CONSENT_MAX_AGE_MS = 396 * 24 * 60 * 60 * 1000;

export type ConsentState = 'accepted' | 'rejected' | 'custom' | 'unknown';

export interface ConsentPreferences {
  /** Les cookies essentiels sont toujours actifs. */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: string;
  updatedAt: string;
}

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredPreferences(value: unknown): value is ConsentPreferences {
  if (!isRecord(value)) return false;
  if (value['necessary'] !== true) return false;
  if (typeof value['analytics'] !== 'boolean') return false;
  if (typeof value['marketing'] !== 'boolean') return false;
  if (value['version'] !== CURRENT_CONSENT_VERSION) return false;
  if (typeof value['updatedAt'] !== 'string') return false;
  const updatedAt = Date.parse(value['updatedAt']);
  if (Number.isNaN(updatedAt)) return false;
  return Date.now() - updatedAt <= CONSENT_MAX_AGE_MS;
}

/**
 * Préférences de consentement (RGPD/CNIL).
 *
 * La lecture de `localStorage` est volontairement séparée de la construction :
 * `App` appelle `initialize()` après le premier rendu navigateur. Le serveur et
 * la première passe d'hydratation rendent donc le même DOM (aucun bandeau),
 * puis le signal affiche le bandeau sans erreur NG0500.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);

  private readonly preferencesState = signal<ConsentPreferences | null>(null);
  private readonly showBannerState = signal(false);
  private initialized = false;

  readonly preferences = this.preferencesState.asReadonly();
  readonly showBanner = this.showBannerState.asReadonly();
  readonly hasConsented = computed(() => this.preferencesState() !== null);
  readonly marketingConsent = computed(() => this.preferencesState()?.marketing === true);
  readonly analyticsConsent = computed(() => this.preferencesState()?.analytics === true);
  readonly state = computed<ConsentState>(() => {
    const preferences = this.preferencesState();
    if (preferences === null) return 'unknown';
    if (preferences.analytics && preferences.marketing) return 'accepted';
    if (!preferences.analytics && !preferences.marketing) return 'rejected';
    return 'custom';
  });

  /** À appeler une seule fois, après hydratation, depuis `App`. */
  initialize(): void {
    if (!this.browser || this.initialized) return;
    this.initialized = true;

    const stored = this.readFromStorage();
    if (stored !== null) {
      this.preferencesState.set(stored);
      this.showBannerState.set(false);
      return;
    }

    this.showBannerState.set(true);
  }

  acceptAll(): void {
    this.savePreferences({ analytics: true, marketing: true });
  }

  rejectAll(): void {
    this.savePreferences({ analytics: false, marketing: false });
  }

  customize(choice: ConsentChoice): void {
    this.savePreferences({
      analytics: choice.analytics,
      marketing: choice.marketing,
    });
  }

  openBanner(): void {
    this.showBannerState.set(true);
  }

  closeBanner(): void {
    this.showBannerState.set(false);
  }

  private savePreferences(choice: ConsentChoice): void {
    const preferences: ConsentPreferences = {
      necessary: true,
      analytics: choice.analytics,
      marketing: choice.marketing,
      version: CURRENT_CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
    };

    this.preferencesState.set(preferences);
    this.showBannerState.set(false);
    this.writeToStorage(preferences);
  }

  private readFromStorage(): ConsentPreferences | null {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw === null) return null;

      const parsed: unknown = JSON.parse(raw);
      if (isStoredPreferences(parsed)) return parsed;

      // Version, forme ou ancienneté invalide : on redemande un choix explicite.
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    } catch {
      return null;
    }
  }

  private writeToStorage(preferences: ConsentPreferences): void {
    if (!this.browser) return;
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Navigation privée ou stockage plein : le choix reste valable en mémoire.
    }
  }
}

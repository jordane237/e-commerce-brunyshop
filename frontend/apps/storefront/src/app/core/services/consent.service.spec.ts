import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONSENT_STORAGE_KEY,
  ConsentService,
  CURRENT_CONSENT_VERSION,
  type ConsentPreferences,
} from './consent.service';

function create(platform: 'browser' | 'server' = 'browser'): ConsentService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform === 'server' ? 'server' : 'browser' }],
  });
  return TestBed.inject(ConsentService);
}

function storedPreferences(overrides: Partial<ConsentPreferences> = {}): ConsentPreferences {
  return {
    necessary: true,
    analytics: true,
    marketing: true,
    version: CURRENT_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function store(preferences: ConsentPreferences): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
}

describe('ConsentService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepte tous les traceurs et persiste le choix', () => {
    const service = create();
    service.initialize();
    service.acceptAll();

    expect(service.marketingConsent()).toBe(true);
    expect(service.analyticsConsent()).toBe(true);
    expect(service.hasConsented()).toBe(true);
    expect(service.showBanner()).toBe(false);

    const saved = JSON.parse(
      localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}',
    ) as ConsentPreferences;
    expect(saved).toMatchObject({ necessary: true, analytics: true, marketing: true });
  });

  it('refuse tous les traceurs et persiste le choix', () => {
    const service = create();
    service.initialize();
    service.rejectAll();

    expect(service.marketingConsent()).toBe(false);
    expect(service.analyticsConsent()).toBe(false);
    expect(service.state()).toBe('rejected');
  });

  it('enregistre des préférences personnalisées', () => {
    const service = create();
    service.initialize();
    service.customize({ analytics: false, marketing: true });

    expect(service.analyticsConsent()).toBe(false);
    expect(service.marketingConsent()).toBe(true);
    expect(service.state()).toBe('custom');
  });

  it('restaure un choix valide au démarrage sans réafficher le bandeau', () => {
    store(storedPreferences());
    const service = create();

    service.initialize();

    expect(service.hasConsented()).toBe(true);
    expect(service.showBanner()).toBe(false);
  });

  it('redemande le consentement si la version a changé', () => {
    store(storedPreferences({ version: '0.9' }));
    const service = create();

    service.initialize();

    expect(service.hasConsented()).toBe(false);
    expect(service.showBanner()).toBe(true);
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('redemande le consentement après 13 mois', () => {
    const oldDate = new Date(Date.now() - 397 * 24 * 60 * 60 * 1000).toISOString();
    store(storedPreferences({ updatedAt: oldDate }));
    const service = create();

    service.initialize();

    expect(service.hasConsented()).toBe(false);
    expect(service.showBanner()).toBe(true);
  });

  it('affiche le bandeau à la demande depuis le footer', () => {
    const service = create();
    service.initialize();
    service.acceptAll();

    service.openBanner();
    expect(service.showBanner()).toBe(true);

    service.closeBanner();
    expect(service.showBanner()).toBe(false);
  });

  it('ne touche pas au stockage côté serveur', () => {
    store(storedPreferences());
    const service = create('server');

    service.initialize();
    service.acceptAll();

    expect(service.showBanner()).toBe(false);
    expect(service.marketingConsent()).toBe(true);
  });
});

import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { UTM_STORAGE_KEY, UtmService } from './utm.service';

function create(platform: 'browser' | 'server' = 'browser'): UtmService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform === 'server' ? 'server' : 'browser' }],
  });
  return TestBed.inject(UtmService);
}

describe('UtmService', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('capture les UTM et le fbclid depuis l’URL', () => {
    window.history.replaceState(
      {},
      '',
      '/?utm_source=facebook&utm_medium=cpc&utm_campaign=soldes-2026&fbclid=abc123',
    );
    const service = create();

    service.captureFromUrl();

    expect(service.getUtms()).toMatchObject({
      source: 'facebook',
      medium: 'cpc',
      campaign: 'soldes-2026',
      fbclid: 'abc123',
      capturedAt: expect.any(String),
    });
  });

  it('ne sauvegarde rien sans paramètre marketing', () => {
    const service = create();

    service.captureFromUrl();

    expect(service.getUtms()).toBeNull();
    expect(localStorage.getItem(UTM_STORAGE_KEY)).toBeNull();
  });

  it('conserve le premier jeu d’UTM lors des navigations suivantes', () => {
    window.history.replaceState({}, '', '/?utm_source=facebook&utm_campaign=premier');
    const service = create();
    service.captureFromUrl();

    window.history.replaceState({}, '', '/?utm_source=google&utm_campaign=second');
    service.captureFromUrl();

    expect(service.getUtms()).toMatchObject({
      source: 'facebook',
      campaign: 'premier',
    });
  });

  it('enrichit le corps de commande avec les UTM stockés', () => {
    window.history.replaceState({}, '', '/?utm_source=facebook&utm_medium=cpc');
    const service = create();
    service.captureFromUrl();

    const body = service.enrichOrderBody({ paymentMethod: 'COD' });

    expect(body).toMatchObject({
      paymentMethod: 'COD',
      source: { source: 'facebook', medium: 'cpc' },
    });
  });

  it('ignore un stockage corrompu', () => {
    localStorage.setItem(UTM_STORAGE_KEY, '{"source":42}');
    const service = create();

    expect(service.getUtms()).toBeNull();
    expect(localStorage.getItem(UTM_STORAGE_KEY)).toBeNull();
  });

  it('ne lit ni n’écrit côté serveur', () => {
    window.history.replaceState({}, '', '/?utm_source=facebook');
    const service = create('server');

    service.captureFromUrl();

    expect(service.getUtms()).toBeNull();
    expect(localStorage.getItem(UTM_STORAGE_KEY)).toBeNull();
    expect(service.enrichOrderBody({ test: true })).toEqual({ test: true });
  });
});

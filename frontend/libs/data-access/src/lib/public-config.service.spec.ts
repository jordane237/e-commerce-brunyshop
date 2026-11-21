import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from './catalog-api';
import { PublicConfigService } from './public-config.service';

describe('PublicConfigService (AUT-11)', () => {
  let service: PublicConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    service = TestBed.inject(PublicConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('met la configuration en cache après le premier appel', () => {
    const values: Array<{ turnstileEnabled: boolean; turnstileSiteKey: string | null }> = [];
    service.getConfig().subscribe((value) => values.push(value));
    service.getConfig().subscribe((value) => values.push(value));

    const request = http.expectOne('/api/v1/config');
    request.flush({ turnstileEnabled: true, turnstileSiteKey: 'site-key' });

    expect(values).toEqual([
      { turnstileEnabled: true, turnstileSiteKey: 'site-key' },
      { turnstileEnabled: true, turnstileSiteKey: 'site-key' },
    ]);
  });

  it('permet de réessayer après une erreur réseau', () => {
    let failed = false;
    service.getConfig().subscribe({ error: () => (failed = true) });
    http.expectOne('/api/v1/config').error(new ProgressEvent('error'));
    expect(failed).toBe(true);

    service.getConfig().subscribe();
    http.expectOne('/api/v1/config').flush({ turnstileEnabled: false, turnstileSiteKey: null });
  });
});

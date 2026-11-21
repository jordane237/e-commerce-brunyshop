import { HttpHeaders, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from './loading.service';

describe('loadingInterceptor (TEC-12)', () => {
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LoadingService] });
    loading = TestBed.inject(LoadingService);
  });

  function run(headers: Record<string, string> = {}) {
    const next: HttpHandlerFn = () => of(new HttpResponse({ status: 200 }));
    return TestBed.runInInjectionContext(() =>
      loadingInterceptor(
        new HttpRequest('GET', '/api/v1/products', null, { headers: new HttpHeaders(headers) }),
        next,
      ),
    );
  }

  it('incrémente puis décrémente le compteur autour de la requête', () => {
    let during = false;
    const next: HttpHandlerFn = () => {
      during = loading.isLoading();
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() =>
      loadingInterceptor(new HttpRequest('GET', '/api/v1/products'), next),
    ).subscribe();

    expect(during).toBe(true);
    expect(loading.isLoading()).toBe(false);
  });

  it('décrémente aussi en cas d’erreur', () => {
    const next: HttpHandlerFn = () => throwError(() => new Error('network'));

    TestBed.runInInjectionContext(() =>
      loadingInterceptor(new HttpRequest('GET', '/api/v1/products'), next),
    ).subscribe({ error: () => undefined });

    expect(loading.isLoading()).toBe(false);
  });

  it('ignore les requêtes marquées X-Skip-Loading', () => {
    run({ 'X-Skip-Loading': 'true' }).subscribe();
    expect(loading.isLoading()).toBe(false);
  });
});

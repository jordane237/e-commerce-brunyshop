import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { requestIdInterceptor } from './request-id.interceptor';

describe('requestIdInterceptor (TEC-12)', () => {
  it('ajoute un X-Request-Id UUID à chaque requête', () => {
    let outgoing!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (request) => {
      outgoing = request;
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() =>
      requestIdInterceptor(new HttpRequest('GET', '/api/v1/products'), next),
    ).subscribe();

    expect(outgoing.headers.get('X-Request-Id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

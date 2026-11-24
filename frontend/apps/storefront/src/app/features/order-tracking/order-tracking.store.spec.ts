import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { OrdersApi, type TrackOrderResponse } from '@bruny/data-access';

import { OrderTrackingStore } from './order-tracking.store';

describe('OrderTrackingStore', () => {
  let orders: { track: ReturnType<typeof vi.fn> };
  let store: OrderTrackingStore;

  beforeEach(() => {
    orders = { track: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: OrdersApi, useValue: orders }],
    });
    store = TestBed.inject(OrderTrackingStore);
  });

  it('track succès → result set, found true', async () => {
    orders.track.mockReturnValue(
      of({
        found: true,
        order: { reference: 'BRN-2611-AAAA', status: 'SHIPPED' },
      } as TrackOrderResponse),
    );
    await store.track('BRN-2611-AAAA', '+237612345678');
    expect(store.loading()).toBe(false);
    expect(store.found()).toBe(true);
    expect(store.isEmpty()).toBe(false);
    expect(store.result()?.found).toBe(true);
  });

  it('track non trouvé → isEmpty true', async () => {
    orders.track.mockReturnValue(of({ found: false }));
    await store.track('BRN-9999-XXXX', '+237612345678');
    expect(store.found()).toBe(false);
    expect(store.isEmpty()).toBe(true);
    expect(store.order()).toBeNull();
  });

  it('track 429 → error rate limit, result null', async () => {
    const err = new Error('rate limited') as Error & { status: number };
    err.status = 429;
    orders.track.mockReturnValue(throwError(() => err));
    await store.track('BRN-2611-AAAA', '+237612345678');
    expect(store.error()).toContain('Trop de tentatives');
    expect(store.result()).toBeNull();
  });

  it('track erreur réseau → error générique, result null', async () => {
    orders.track.mockReturnValue(throwError(() => new Error('network')));
    await store.track('BRN-2611-AAAA', '+237612345678');
    expect(store.error()).toContain('Impossible de vérifier');
    expect(store.result()).toBeNull();
  });

  it('reset → result et error null', async () => {
    orders.track.mockReturnValue(of({ found: false }));
    await store.track('BRN-9999-XXXX', '+237612345678');
    store.reset();
    expect(store.result()).toBeNull();
    expect(store.error()).toBeNull();
  });
});

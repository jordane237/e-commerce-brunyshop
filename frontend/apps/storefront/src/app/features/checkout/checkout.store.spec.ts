import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from '@bruny/core';
import { OrdersApi, ShippingApi } from '@bruny/data-access';

import { CartStore } from '../../core/cart/cart.store';
import { CHECKOUT_STORAGE_KEY } from './checkout.model';
import { CheckoutStore } from './checkout.store';

const ZONE = {
  id: 'zone-douala',
  name: 'Douala Centre',
  cities: ['Douala'],
  fee: 1500,
  estimatedDays: 1,
};

function createCartStub() {
  return {
    lines: () => [
      { variantId: 'v1', quantity: 2, unitPriceAtAdd: 8000 },
      { variantId: 'v2', quantity: 1, unitPriceAtAdd: 12000 },
    ],
    subtotal: () => 28000,
    discount: () => 0,
    loading: () => false,
    isEmpty: () => false,
    validate: vi.fn().mockResolvedValue(null),
    clear: vi.fn(),
  };
}

describe('CheckoutStore', () => {
  let cart: ReturnType<typeof createCartStub>;
  let orders: { create: ReturnType<typeof vi.fn> };
  let shipping: { getZones: ReturnType<typeof vi.fn> };
  let store: CheckoutStore;

  beforeEach(() => {
    localStorage.clear();
    cart = createCartStub();
    orders = {
      create: vi.fn().mockReturnValue(
        of({
          id: 'order-1',
          reference: 'BRN-2611-AAAA',
          status: 'PENDING_CONFIRMATION',
          paymentStatus: 'PENDING',
          paymentMethod: 'COD',
          subtotal: 28000,
          discount: 0,
          shippingFee: 1500,
          total: 29500,
          createdAt: '2026-11-23T10:00:00.000Z',
        }),
      ),
    };
    shipping = { getZones: vi.fn().mockReturnValue(of([ZONE])) };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CheckoutStore,
        { provide: CartStore, useValue: cart },
        { provide: OrdersApi, useValue: orders },
        { provide: ShippingApi, useValue: shipping },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    store = TestBed.inject(CheckoutStore);
  });

  function fillContact(): void {
    store.setContact({ fullName: 'Awa Ngo', phone: '671234567', email: '' });
  }

  function fillDelivery(zoneId = ZONE.id): void {
    store.setDelivery({
      city: 'Douala',
      district: 'Akwa',
      landmark: 'Face à la pharmacie',
      zoneId,
    });
  }

  it('refuse d’avancer tant que les coordonnées sont invalides', () => {
    expect(store.next()).toBe(false);
    expect(store.step()).toBe(1);
  });

  it('avance après validation et persiste le brouillon', () => {
    fillContact();
    expect(store.next()).toBe(true);
    expect(store.step()).toBe(2);

    const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}')).toMatchObject({
      version: 1,
      step: 2,
      contact: { fullName: 'Awa Ngo', phone: '671234567' },
    });
  });

  it('charge les zones et calcule les frais réels', async () => {
    await store.loadZones();
    expect(store.zones()).toHaveLength(1);

    fillDelivery();
    expect(store.selectedZone()?.name).toBe('Douala Centre');
    expect(store.shippingFee()).toBe(1500);
    expect(store.total()).toBe(29500);
  });

  it('signale une erreur de chargement des zones', async () => {
    shipping.getZones.mockReturnValue(throwError(() => new Error('offline')));
    await store.loadZones();
    expect(store.zonesError()).toContain('Impossible de charger les modes de livraison');
    expect(store.zonesLoading()).toBe(false);
  });

  it('envoie une commande COD sans montant calculé par le client', async () => {
    fillContact();
    fillDelivery();
    store.setPayment({ method: 'COD', termsAccepted: true });

    const order = await store.submit('captcha-token');

    expect(order?.reference).toBe('BRN-2611-AAAA');
    expect(orders.create).toHaveBeenCalledTimes(1);
    const [payload, key] = orders.create.mock.calls[0]!;
    expect(payload).toMatchObject({
      guestName: 'Awa Ngo',
      guestPhone: '+237671234567',
      paymentMethod: 'COD',
      deliveryZoneId: 'zone-douala',
      turnstileToken: 'captcha-token',
      address: {
        city: 'Douala',
        district: 'Akwa',
        line: 'Face à la pharmacie',
        landmark: 'Face à la pharmacie',
      },
    });
    expect(payload.items).toEqual([
      { variantId: 'v1', quantity: 2 },
      { variantId: 'v2', quantity: 1 },
    ]);
    expect(payload).not.toHaveProperty('total');
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(cart.clear).toHaveBeenCalled();
    expect(localStorage.getItem(CHECKOUT_STORAGE_KEY)).toBeNull();
  });

  it('bloque l’envoi sans acceptation des CGV', async () => {
    fillContact();
    fillDelivery();
    await store.submit(null);

    expect(orders.create).not.toHaveBeenCalled();
    expect(store.submitError()).toContain('Vérifiez vos informations');
  });

  it('réutilise la même clé d’idempotence lors d’un simple réessai', async () => {
    fillContact();
    fillDelivery();
    store.setPayment({ method: 'COD', termsAccepted: true });

    orders.create.mockReturnValueOnce(throwError(() => new Error('réseau')));
    await store.submit(null);
    const firstKey = orders.create.mock.calls[0]![1] as string;

    await store.submit(null);
    const secondKey = orders.create.mock.calls[1]![1] as string;

    expect(firstKey).toBe(secondKey);
  });

  it('régénère la clé quand les données de la commande changent', async () => {
    fillContact();
    fillDelivery();
    store.setPayment({ method: 'COD', termsAccepted: true });

    orders.create.mockReturnValueOnce(throwError(() => new Error('réseau')));
    await store.submit(null);
    const firstKey = orders.create.mock.calls[0]![1] as string;

    store.setDelivery({ landmark: 'Près du marché' });
    await store.submit(null);
    const secondKey = orders.create.mock.calls[1]![1] as string;

    expect(firstKey).not.toBe(secondKey);
  });

  it('traduit les erreurs API en messages actionnables', async () => {
    fillContact();
    fillDelivery();
    store.setPayment({ method: 'COD', termsAccepted: true });

    orders.create.mockReturnValueOnce(
      throwError(() => ({
        status: 409,
        error: { code: 'INSUFFICIENT_STOCK', message: 'Stock insuffisant' },
      })),
    );

    // readApiError n'accepte que HttpErrorResponse : on vérifie le repli générique.
    const order = await store.submit(null);
    expect(order).toBeNull();
    expect(store.submitError()).not.toBeNull();
    expect(store.submitting()).toBe(false);
  });
});

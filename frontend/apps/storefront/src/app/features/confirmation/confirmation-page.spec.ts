import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import type { CartLine } from '../../core/cart/cart.model';
import type { CreateOrderResponse } from '@bruny/data-access';
import { CheckoutStore } from '../checkout/checkout.store';
import { toOrderPhone } from '../checkout/checkout.model';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { SeoService } from '../../core/seo.service';
import { ConfirmationPage } from './confirmation-page';

const ORDER: CreateOrderResponse = {
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
};

const ITEMS: CartLine[] = [
  {
    variantId: 'v1',
    quantity: 2,
    unitPriceAtAdd: 8000,
    productName: 'Mocassin Cuir',
    color: 'Noir',
    size: '41',
    imageUrl: '/mocassin.jpg',
  },
];

function createFixture(order: CreateOrderResponse | null = ORDER) {
  const orderState = signal<CreateOrderResponse | null>(order);
  const itemsState = signal<CartLine[]>(order === null ? [] : ITEMS);
  const contactState = signal({ fullName: 'Awa Ngo', phone: '671234567', email: '' });
  const deliveryState = signal({
    city: 'Douala',
    district: 'Akwa',
    landmark: 'Face à la pharmacie',
    zoneId: 'zone-douala',
  });

  const whatsapp = {
    configured: true,
    buildLink: vi.fn(() => 'https://wa.me/237679176296?text=Bonjour%20BRN-2611-AAAA'),
  };
  const seo = { setPageMeta: vi.fn() };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ConfirmationPage],
    providers: [
      provideRouter([]),
      {
        provide: CheckoutStore,
        useValue: {
          order: orderState,
          submittedItems: itemsState,
          contact: contactState,
          delivery: deliveryState,
        },
      },
      { provide: WhatsAppService, useValue: whatsapp },
      { provide: SeoService, useValue: seo },
    ],
  });

  const fixture = TestBed.createComponent(ConfirmationPage);
  fixture.detectChanges();
  return { fixture, orderState, whatsapp };
}

describe('ConfirmationPage', () => {
  it('affiche la référence, le récapitulatif et la livraison', () => {
    const { fixture } = createFixture();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('BRN-2611-AAAA');
    expect(text).toContain('Mocassin Cuir');
    expect(text).toContain('Douala');
    expect(text).toContain('Akwa');
    expect(text).toContain('Paiement à la livraison');
  });

  it('copie la référence avec l’API Clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const { fixture } = createFixture();
    await fixture.componentInstance.copyReference();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('BRN-2611-AAAA');
    expect(fixture.nativeElement.textContent).toContain('Copié');
    expect(fixture.nativeElement.textContent).toContain('Numéro de commande copié.');
  });

  it('affiche une erreur si la copie échoue', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    const execCommand = vi.fn(() => false);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    const { fixture } = createFixture();
    await fixture.componentInstance.copyReference();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Copie impossible');
  });

  it('construit le lien WhatsApp prérempli avec la référence', () => {
    const { fixture, whatsapp } = createFixture();
    const link = fixture.nativeElement.querySelector(
      '.confirmation-actions__whatsapp',
    ) as HTMLAnchorElement;

    expect(whatsapp.buildLink).toHaveBeenCalledWith({
      page: 'confirmation',
      orderReference: 'BRN-2611-AAAA',
    });
    expect(link.getAttribute('href')).toContain('wa.me');
  });

  it('préremplit le lien de suivi avec la référence et le téléphone normalisé', () => {
    const { fixture } = createFixture();
    const link = fixture.nativeElement.querySelector(
      '.confirmation-actions__secondary',
    ) as HTMLAnchorElement;
    const href = link.getAttribute('href') ?? '';

    expect(href).toContain('/suivi');
    expect(href).toContain('reference=BRN-2611-AAAA');
    expect(href).toContain(encodeURIComponent(toOrderPhone('671234567')));
  });

  it('affiche l’état vide si aucune commande n’est disponible', () => {
    const { fixture } = createFixture(null);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Commande introuvable');
    expect(text).not.toContain('BRN-2611-AAAA');
  });
});

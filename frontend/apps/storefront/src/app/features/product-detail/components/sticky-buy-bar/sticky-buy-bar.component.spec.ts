import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { StickyBuyBarComponent } from './sticky-buy-bar.component';

describe('StickyBuyBarComponent', () => {
  async function create(overrides: Record<string, unknown> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [StickyBuyBarComponent] });
    const fixture = TestBed.createComponent(StickyBuyBarComponent);
    fixture.componentRef.setInput('effectivePrice', 25000);
    fixture.componentRef.setInput('originalPrice', 30000);
    fixture.componentRef.setInput('canAddToCart', true);
    fixture.componentRef.setInput('addToCartMessage', '');
    fixture.componentRef.setInput('whatsappUrl', 'https://wa.me/237679176296?text=Bonjour');
    fixture.componentRef.setInput('productName', 'Mocassin Cuir');
    for (const [key, value] of Object.entries(overrides)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('affiche le prix, l’ancien prix et les actions', async () => {
    const { element } = await create();
    const text = element.textContent?.replace(/\s/g, ' ');

    expect(text).toContain('Total à payer');
    expect(text).toContain('25 000 FCFA');
    expect(text).toContain('30 000 FCFA');
    expect(text).toContain('Ajouter au panier');
    expect(text).toContain('WhatsApp');
  });

  it('désactive le CTA et affiche le message explicite', async () => {
    const { element } = await create({
      canAddToCart: false,
      addToCartMessage: 'Sélectionnez une pointure',
    });
    const button = element.querySelector('bruny-button button') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(element.querySelector('.sticky-buy-bar__help')?.textContent).toContain(
      'Sélectionnez une pointure',
    );
  });

  it('émet addToCart au clic quand la sélection est valide', async () => {
    const { fixture, element } = await create();
    let calls = 0;
    fixture.componentInstance.addToCart.subscribe(() => (calls += 1));

    (element.querySelector('bruny-button button') as HTMLButtonElement).click();

    expect(calls).toBe(1);
  });

  it('ouvre WhatsApp dans un nouvel onglet de façon sécurisée', async () => {
    const { element } = await create();
    const link = element.querySelector('.sticky-buy-bar__whatsapp') as HTMLAnchorElement;

    expect(link.href).toContain('https://wa.me/237679176296');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });
});

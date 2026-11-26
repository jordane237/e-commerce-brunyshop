import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartSummaryComponent } from './cart-summary.component';

describe('CartSummaryComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Record<string, unknown> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CartSummaryComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(CartSummaryComponent);
    fixture.componentRef.setInput('subtotal', 50000);
    fixture.componentRef.setInput('discount', 0);
    fixture.componentRef.setInput('shippingFee', null);
    fixture.componentRef.setInput('total', 50000);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('canCheckout', true);
    for (const [key, value] of Object.entries(overrides)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('affiche le sous-total, la livraison estimée et le total en FCFA', async () => {
    const { element } = await create();
    const text = element.textContent?.replace(/\s/g, ' ');

    expect(text).toContain('Sous-total');
    expect(text).toContain('50 000 FCFA');
    expect(text).toContain("Calculée à l'étape suivante");
    expect(
      element.querySelector('.cart-summary__row--total')?.textContent?.replace(/\s/g, ' '),
    ).toContain('50 000 FCFA');
  });

  it('affiche la remise uniquement lorsqu’elle est positive', async () => {
    const withoutDiscount = await create();
    expect(withoutDiscount.element.textContent).not.toContain('Remise');

    TestBed.resetTestingModule();
    const withDiscount = await create({ discount: 5000, total: 45000 });
    expect(withDiscount.element.textContent).toContain('Remise');
    expect(withDiscount.element.textContent?.replace(/\s/g, ' ')).toContain('5 000 FCFA');
  });

  it('désactive le CTA quand la commande n’est pas possible', async () => {
    const { element } = await create({ canCheckout: false });
    const button = element.querySelector('bruny-button button') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Passer la commande');
  });

  it('active le CTA et ouvre le tunnel de commande quand le panier est valide', async () => {
    const { fixture, element } = await create({ canCheckout: true });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = element.querySelector('bruny-button button') as HTMLButtonElement;

    expect(button.disabled).toBe(false);
    button.click();
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/commande']);
  });

  it('affiche des squelettes pendant le chargement', async () => {
    const { element } = await create({ loading: true });
    expect(element.querySelectorAll('bruny-skeleton').length).toBeGreaterThan(0);
    expect(element.textContent).not.toContain('Passer la commande');
  });
});

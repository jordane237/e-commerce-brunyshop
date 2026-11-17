import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import type { CartIssueDto, CartItemValidationDto } from '@bruny/data-access';
import type { CartLine } from '../../../../core/cart/cart.model';
import { CartLineItemComponent } from './cart-line-item.component';

const line: CartLine = {
  variantId: 'variant-1',
  productId: 'product-1',
  productSlug: 'mocassin-cuir',
  productName: 'Mocassin Cuir',
  variantSku: 'SKU-1',
  size: '42',
  color: 'Noir',
  quantity: 2,
  unitPriceAtAdd: 20000,
  imageUrl: 'https://cdn.example.com/mocassin.jpg',
  imageAlt: 'Mocassin en cuir noir',
  addedAt: '2026-11-17T10:00:00.000Z',
};

const validation: CartItemValidationDto = {
  variantId: 'variant-1',
  productId: 'product-1',
  productName: 'Mocassin Cuir',
  variantSku: 'SKU-1',
  size: '42',
  color: 'Noir',
  quantity: 2,
  availableStock: 3,
  unitPrice: 25000,
  lineTotal: 50000,
  issues: [],
};

const issue: CartIssueDto = {
  code: 'INSUFFICIENT_STOCK',
  message: 'Stock insuffisant : 3 unités disponibles.',
  variantId: 'variant-1',
};

describe('CartLineItemComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(
    overrides: { validation?: CartItemValidationDto | null; issue?: CartIssueDto | null } = {},
  ) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CartLineItemComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(CartLineItemComponent);
    fixture.componentRef.setInput('line', line);
    fixture.componentRef.setInput('quantity', 2);
    fixture.componentRef.setInput('validationLine', overrides.validation ?? null);
    fixture.componentRef.setInput('issue', overrides.issue ?? null);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('affiche le produit, la variante et utilise le prix serveur', async () => {
    const { element } = await create({ validation });

    expect(element.textContent).toContain('Mocassin Cuir');
    expect(element.textContent).toContain('Noir · Pointure 42');
    expect(element.textContent?.replace(/\s/g, ' ')).toContain('50 000 FCFA');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Mocassin en cuir noir');
  });

  it('limite la quantité au stock disponible', async () => {
    const { element } = await create({ validation });
    expect(element.querySelector('.qty-selector__input')?.getAttribute('max')).toBe('3');
  });

  it('affiche une issue de ligne et émet la suppression', async () => {
    const { fixture, element } = await create({ validation, issue });
    let removed: string | null = null;
    fixture.componentInstance.removed.subscribe((value) => (removed = value));

    expect(element.querySelector('.cart-line__issue')?.textContent).toContain('Stock insuffisant');

    (element.querySelector('.cart-line__remove') as HTMLButtonElement).click();
    expect(removed).toBe('variant-1');
  });

  it('émet la nouvelle quantité depuis le sélecteur', async () => {
    const { fixture, element } = await create({ validation });
    let quantity: number | null = null;
    fixture.componentInstance.quantityChange.subscribe((value) => (quantity = value));

    (
      element.querySelector(
        'button[aria-label="Augmenter la quantité de Mocassin Cuir"]',
      ) as HTMLButtonElement
    ).click();
    expect(quantity).toBe(3);
  });
});

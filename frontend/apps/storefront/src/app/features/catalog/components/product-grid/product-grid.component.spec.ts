import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogProduct } from '@bruny/data-access';
import { describe, expect, it, vi } from 'vitest';
import { ProductGridComponent } from './product-grid.component';

const product: CatalogProduct = {
  id: '1',
  name: 'Mocassin Cuir',
  slug: 'mocassin-cuir',
  description: '',
  basePrice: 25000,
  effectivePrice: 25000,
  promoPrice: null,
  promoStart: null,
  promoEnd: null,
  isPromoActive: false,
  inStock: true,
  category: { id: '1', name: 'Mocassins', slug: 'mocassins' },
  brand: { id: 'b1', name: 'Kepe', slug: 'kepe', logo: null },
  images: [],
  variants: [],
};

async function create(loading: boolean, products: CatalogProduct[]) {
  const fixture = TestBed.configureTestingModule({
    imports: [ProductGridComponent],
    providers: [provideRouter([])],
  }).createComponent(ProductGridComponent);
  fixture.componentRef.setInput('loading', loading);
  fixture.componentRef.setInput('products', products);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('ProductGridComponent', () => {
  it('renders eight skeletons while loading', async () => {
    const fixture = await create(true, []);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.grid__skeleton')).toHaveLength(8);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelectorAll('bruny-product-card')).toHaveLength(0);
  });

  it('renders a semantic list of product cards', async () => {
    const fixture = await create(false, [product]);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ul[role="list"]')).not.toBeNull();
    expect(element.querySelectorAll('li')).toHaveLength(1);
    expect(element.querySelector('bruny-product-card')).not.toBeNull();
  });

  it('forwards the add action with the product', async () => {
    const fixture = await create(false, [product]);
    const add = vi.fn();
    fixture.componentInstance.add.subscribe(add);

    (fixture.nativeElement.querySelector('.bs-button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(add).toHaveBeenCalledWith(product);
  });
});

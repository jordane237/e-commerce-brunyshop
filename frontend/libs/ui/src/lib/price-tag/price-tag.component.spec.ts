import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PriceTagComponent } from './price-tag.component';
import { FcfaPipe } from '@bruny/util/lib/fcfa.pipe';

@Component({
  standalone: true,
  imports: [PriceTagComponent, FcfaPipe],
  template: ` <bruny-price-tag [amount]="amount()" [compareAt]="compareAt()" [size]="size()" /> `,
})
class PriceTagHostComponent {
  readonly amount = signal(24500);
  readonly compareAt = signal<number | null>(32000);
  readonly size = signal<'sm' | 'lg'>('sm');
}

describe('PriceTagComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof PriceTagHostComponent, unknown>> = {}) {
    await TestBed.configureTestingModule({
      imports: [PriceTagHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PriceTagHostComponent);
    await fixture.whenStable();
    for (const [key, value] of Object.entries(overrides)) {
      (fixture.componentInstance as Record<string, never>)[key] = value as never;
    }
    await fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders the current price formatted in FCFA', async () => {
    const { nativeElement } = await create();
    await Promise.resolve();
    const span = nativeElement.querySelector('.bs-price');
    const strong = span?.querySelector('.bs-price__current');

    expect(strong?.textContent).toBe('24 500 FCFA');
  });

  it('shows a strike-through compare-at price when it is higher than the amount', async () => {
    const { nativeElement } = await create({ compareAt: 32000, amount: 24500 });
    await Promise.resolve();
    const compare = nativeElement.querySelector('.bs-price__compare');

    expect(compare?.textContent).toBe('32 000 FCFA');
    expect(nativeElement.textContent).toContain('24 500 FCFA');
  });

  it('hides the compare-at price when it equals or is below the amount', async () => {
    const { nativeElement, componentInstance } = await create();

    componentInstance.compareAt.set(24500);
    await Promise.resolve();

    expect(nativeElement.querySelector('.bs-price__compare')).toBeNull();
  });

  it('hides the compare-at price when the value is null', async () => {
    const { nativeElement } = await create({ compareAt: null });
    await Promise.resolve();

    expect(nativeElement.querySelector('.bs-price__compare')).toBeNull();
  });

  it('applies the large size class when size is lg', async () => {
    const { nativeElement, fixture } = await create({ size: 'lg' });
    await Promise.resolve();
    const span = nativeElement.querySelector('.bs-price');

    expect(span?.classList).toContain('bs-price--lg');
    expect(span?.classList).not.toContain('bs-price--sm');
    await fixture.detectChanges();
  });

  it('applies the small size class when size is sm', async () => {
    const { nativeElement, fixture } = await create({ size: 'sm' });
    await Promise.resolve();
    const span = nativeElement.querySelector('.bs-price');

    expect(span?.classList).toContain('bs-price--sm');
    expect(span?.classList).not.toContain('bs-price--lg');
    await fixture.detectChanges();
  });

  it('rounds the displayed amount to the nearest 500 FCFA', async () => {
    const { nativeElement, componentInstance, fixture } = await create({ amount: 24730 });
    await Promise.resolve();
    componentInstance.amount.set(24730);
    await fixture.detectChanges();
    await Promise.resolve();
    const strong = nativeElement.querySelector('.bs-price__current') as HTMLElement;

    expect(strong?.textContent).toBe('25 000 FCFA');
    await fixture.detectChanges();
  });

  it('renders a zero price for a free product', async () => {
    const { nativeElement, componentInstance, fixture } = await create({ amount: 0 });
    await Promise.resolve();
    componentInstance.amount.set(0);
    await fixture.detectChanges();
    const strong = nativeElement.querySelector('.bs-price__current') as HTMLElement;

    expect(strong?.textContent).toBe('0 FCFA');
    await fixture.detectChanges();
  });

  it('renders dashes when the amount is negative', async () => {
    const { nativeElement, componentInstance, fixture } = await create({ amount: -100 });
    await Promise.resolve();
    componentInstance.amount.set(-100);
    await fixture.detectChanges();
    const strong = nativeElement.querySelector('.bs-price__current') as HTMLElement;

    expect(strong?.textContent).toBe('- -');
    await fixture.detectChanges();
  });
});

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PriceTagComponent } from './price-tag.component';

@Component({
  standalone: true,
  imports: [PriceTagComponent],
  template: ` <bruny-price-tag [amount]="amount()" [compareAt]="compareAt()" [size]="size()" /> `,
})
class PriceTagHostComponent {
  readonly amount = signal(24500);
  readonly compareAt = signal<number | null>(32000);
  readonly size = signal<'sm' | 'md' | 'lg'>('sm');
}

function setHostValue(instance: object, key: string, value: unknown): void {
  const record = instance as Record<string, unknown>;
  const current = record[key];
  if (typeof current === 'function' && 'set' in current) {
    (current as { set: (next: unknown) => void }).set(value);
    return;
  }
  record[key] = value;
}

describe('PriceTagComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof PriceTagHostComponent, unknown>> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [PriceTagHostComponent] });
    const fixture = TestBed.createComponent(PriceTagHostComponent);
    fixture.detectChanges();
    for (const [key, value] of Object.entries(overrides)) {
      setHostValue(fixture.componentInstance, key, value);
    }
    fixture.detectChanges();
    return {
      fixture,
      nativeElement: fixture.nativeElement as HTMLElement,
      componentInstance: fixture.componentInstance,
    };
  }

  it('renders the current price in FCFA with U+00A0', async () => {
    const { nativeElement } = await create();
    expect(nativeElement.querySelector('.bs-price__current')?.textContent).toBe(
      '24\u00a0500\u00a0FCFA',
    );
  });

  it('shows a strike-through compare-at price when it is higher', async () => {
    const { nativeElement } = await create();
    const compare = nativeElement.querySelector('.bs-price__compare') as HTMLElement;

    expect(compare.textContent).toBe('32\u00a0000\u00a0FCFA');
  });

  it('hides the compare-at price when it is not higher', async () => {
    const { nativeElement } = await create({ compareAt: 24500 });
    expect(nativeElement.querySelector('.bs-price__compare')).toBeNull();
  });

  it('hides the compare-at price when null', async () => {
    const { nativeElement } = await create({ compareAt: null });
    expect(nativeElement.querySelector('.bs-price__compare')).toBeNull();
  });

  it('applies the size class', async () => {
    const { nativeElement } = await create({ size: 'lg' });
    expect(nativeElement.querySelector('.bs-price')?.classList).toContain('bs-price--lg');
  });

  it('formats an amount without rounding it', async () => {
    const { fixture, nativeElement } = await create();
    fixture.componentInstance.amount.set(24730);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.bs-price__current')?.textContent).toBe(
      '24\u00a0730\u00a0FCFA',
    );
  });
});

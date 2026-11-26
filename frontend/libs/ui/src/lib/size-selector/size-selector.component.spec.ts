import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { SizeSelectorComponent, type SizeSelectorItem } from './size-selector.component';

interface HostItem extends SizeSelectorItem {
  id: string;
  size: string;
  stock: number;
}

@Component({
  standalone: true,
  imports: [SizeSelectorComponent],
  template: `
    <bruny-size-selector
      [items]="items()"
      [selected]="selected()"
      [readonly]="readonly()"
      [maxItems]="maxItems()"
      [loading]="loading()"
      [showLabel]="showLabel()"
      [term]="term()"
      [lowStockThreshold]="lowStockThreshold()"
      (select)="selected.set($event)"
    />
  `,
})
class SizeSelectorHostComponent {
  readonly items = signal<HostItem[]>([
    { id: 'v1', size: '41', stock: 3 },
    { id: 'v2', size: '42', stock: 2 },
    { id: 'v3', size: '43', stock: 0 },
  ]);
  readonly selected = signal<{ id: string; size: string } | null>(null);
  readonly readonly = signal(false);
  readonly maxItems = signal<number | null>(null);
  readonly loading = signal(false);
  readonly showLabel = signal(true);
  readonly term = signal('Taille');
  readonly lowStockThreshold = signal<number | null>(null);
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

describe('SizeSelectorComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof SizeSelectorHostComponent, unknown>> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [SizeSelectorHostComponent] });
    const fixture = TestBed.createComponent(SizeSelectorHostComponent);
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

  it('renders sizes and marks the selected one', async () => {
    const { nativeElement } = await create({ selected: { id: 'v2', size: '42' } });
    const buttons = nativeElement.querySelectorAll('.bs-size');

    expect(buttons.length).toBe(3);
    expect(nativeElement.querySelector('.bs-size--selected')?.textContent).toContain('42');
  });

  it('emits the selected size and does not emit for the current one', async () => {
    const { nativeElement, componentInstance, fixture } = await create();
    const buttons = nativeElement.querySelectorAll('.bs-size');

    (buttons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(componentInstance.selected()).toMatchObject({ id: 'v2', size: '42' });

    (buttons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(componentInstance.selected()).toMatchObject({ id: 'v2', size: '42' });
  });

  it('disables out-of-stock sizes', async () => {
    const { nativeElement } = await create({
      items: [{ id: 'v1', size: '43', stock: 0 }],
    });
    const disabled = nativeElement.querySelector('.bs-size--disabled') as HTMLButtonElement;

    expect(disabled.disabled).toBe(true);
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.getAttribute('aria-label')).toBe('Taille 43 (indisponible)');
  });

  it('exposes stock in the accessible label', async () => {
    const { nativeElement } = await create({
      items: [{ id: 'v1', size: '41', stock: 3 }],
    });
    const button = nativeElement.querySelector('.bs-size') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Taille 41, 3 en stock');
  });

  it('does not emit when readonly', async () => {
    const { nativeElement, componentInstance } = await create({ readonly: true });
    const button = nativeElement.querySelector('.bs-size') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    button.click();
    expect(componentInstance.selected()).toBeNull();
  });

  it('shows the overflow label with maxItems', async () => {
    const { nativeElement } = await create({
      items: [
        { id: 'v1', size: '41', stock: 2 },
        { id: 'v2', size: '42', stock: 2 },
        { id: 'v3', size: '43', stock: 2 },
      ],
      maxItems: 2,
    });

    expect(nativeElement.querySelector('.bs-size-selector__more')?.textContent).toContain(
      'autres pointures',
    );
    expect(nativeElement.querySelectorAll('.bs-size').length).toBe(1);
  });

  it('affiche « Plus que X en stock » sous une pointure faible', async () => {
    const { nativeElement } = await create({
      items: [{ id: 'v1', size: '42', stock: 2 }],
      lowStockThreshold: 3,
      term: 'Pointure',
    });

    expect(nativeElement.querySelector('.bs-size-selector__low-stock')?.textContent).toContain(
      'Plus que 2 en stock',
    );
    expect(nativeElement.querySelector('.bs-size')?.getAttribute('aria-label')).toBe(
      'Pointure 42, plus que 2 en stock',
    );
  });

  it('expose un radiogroup et l’état coché', async () => {
    const { nativeElement } = await create({ selected: { id: 'v2', size: '42' } });

    expect(nativeElement.querySelector('[role="radiogroup"]')).not.toBeNull();
    expect(nativeElement.querySelectorAll('[role="radio"]').length).toBe(3);
    expect(nativeElement.querySelector('.bs-size--selected')?.getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('ne rend pas la ligne « Sélectionner » quand showLabel est faux', async () => {
    const { nativeElement } = await create({ showLabel: false });

    expect(nativeElement.querySelector('.bs-size-selector__label')).toBeNull();
  });

  it('does not crash with an empty list', async () => {
    const { nativeElement } = await create({ items: [] });

    expect(nativeElement.querySelectorAll('.bs-size').length).toBe(0);
    expect(nativeElement.querySelector('.bs-size-selector')).not.toBeNull();
  });
});

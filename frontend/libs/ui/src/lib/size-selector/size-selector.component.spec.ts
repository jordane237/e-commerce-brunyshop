import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { SizeSelectorComponent } from './size-selector.component';

interface HostSizeSelectorItem {
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
      (select)="onSelect($event)"
    />
  `,
})
class SizeSelectorHostComponent {
  readonly items = signal<HostSizeSelectorItem[]>([
    { id: 'v1', size: '41', stock: 3 },
    { id: 'v2', size: '42', stock: 2 },
    { id: 'v3', size: '43', stock: 0 },
  ]);
  readonly selected = signal<{ id: string; size: string } | null>(null);
  readonly readonly = signal(false);
  readonly maxItems = signal<number | null>(null);
  readonly loading = signal(false);
  readonly selectedIds = signal<string[]>([]);

  onSelect(event: { id: string; size: string }): void {
    this.selectedIds.update((current) =>
      current.includes(event.id) ? current.filter((id) => id !== event.id) : [...current, event.id],
    );
    this.selected.set(event);
  }
}

describe('SizeSelectorComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof SizeSelectorHostComponent, unknown>> = {}) {
    await TestBed.configureTestingModule({
      imports: [SizeSelectorHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SizeSelectorHostComponent);
    await fixture.whenStable();
    for (const [key, value] of Object.entries(overrides)) {
      (fixture.componentInstance as Record<string, never>)[key] = value as never;
    }
    await fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders all available sizes from the items list', async () => {
    const { nativeElement, fixture } = await create();
    const buttons = nativeElement.querySelectorAll('button');

    expect(buttons.length).toBeGreaterThanOrEqual(3);
    expect(nativeElement.textContent).toContain('41');
    expect(nativeElement.textContent).toContain('42');
    expect(nativeElement.textContent).toContain('43');
    await Promise.resolve();
    await fixture.detectChanges();
  });

  it('marks the selected size as active', async () => {
    const { nativeElement, fixture } = await create({ selected: { id: 'v2', size: '42' } });

    expect(nativeElement.querySelector('.bs-size--selected')?.textContent).toBe('42');
    expect(nativeElement.textContent).toContain('42');
    await fixture.detectChanges();
  });

  it('selects a size when the button is clicked and emits the new value', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      selected: { id: 'v1', size: '41' },
    });
    const buttons = nativeElement.querySelectorAll('button');

    expect(componentInstance.selected()).toEqual({ id: 'v1', size: '41' });
    expect(componentInstance.selectedIds()).toContain('v1');

    buttons.forEach((button) => {
      if (button instanceof HTMLButtonElement && button.textContent?.trim() === '42') {
        button.click();
      }
    });
    await fixture.whenStable?.();
    await Promise.resolve();
    await fixture.detectChanges();

    expect(componentInstance.selected()).toEqual({ id: 'v2', size: '42' });
    expect(componentInstance.selectedIds()).toContain('v1');
    expect(componentInstance.selectedIds()).toContain('v2');
  });

  it('does not emit when clicking the already selected size', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      selected: { id: 'v2', size: '42' },
    });
    const buttons = nativeElement.querySelectorAll('button');

    buttons.forEach((button) => {
      if (button instanceof HTMLButtonElement && button.textContent?.trim() === '42') {
        button.click();
      }
    });
    await fixture.whenStable?.();
    await Promise.resolve();
    await fixture.detectChanges();

    expect(componentInstance.selected()).toEqual({ id: 'v2', size: '42' });
  });

  it('marks an out-of-stock size as disabled', async () => {
    const { nativeElement, fixture } = await create({
      items: [{ id: 'v1', size: '43', stock: 0 }],
    });
    const disabledButtons = nativeElement.querySelectorAll('button[disabled]');

    expect(disabledButtons.length).toBeGreaterThanOrEqual(1);
    expect(disabledButtons[0]?.textContent).toBe('43');
    expect(disabledButtons[0]?.getAttribute('aria-disabled')).toBe('true');
    await fixture.detectChanges();
  });

  it('does not allow selecting a disabled size', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      items: [{ id: 'v1', size: '43', stock: 0 }],
      selected: null,
    });
    const buttons = nativeElement.querySelectorAll('button');

    buttons.forEach((button) => {
      if (button instanceof HTMLButtonElement && button.textContent?.trim() === '43') {
        button.click();
      }
    });
    await fixture.whenStable?.();
    await Promise.resolve();
    await fixture.detectChanges();

    expect(componentInstance.selected()).toBeNull();
    expect(componentInstance.selectedIds()).toEqual([]);
  });

  it('shows the disabled state for out of stock sizes and hides the stock count', async () => {
    const { nativeElement, fixture } = await create({
      items: [
        { id: 'v1', size: '41', stock: 3 },
        { id: 'v2', size: '43', stock: 0 },
      ],
    });

    expect(nativeElement.querySelector('.bs-size--disabled')?.textContent).toContain('43');
    await fixture.detectChanges();
  });

  it('uses an accessible description for sizes with stock', async () => {
    const { nativeElement, fixture } = await create({
      items: [{ id: 'v1', size: '41', stock: 3 }],
    });
    const button = nativeElement.querySelector('button[aria-label]') as HTMLButtonElement;

    expect(button?.getAttribute('aria-label')).toBe('Taille 41, 3 en stock');
    await fixture.detectChanges();
  });

  it('omits the stock count from the aria-label when stock is unavailable', async () => {
    const { nativeElement, fixture } = await create({
      items: [{ id: 'v1', size: '43', stock: 0 }],
    });
    const button = nativeElement.querySelector('button[aria-label]') as HTMLButtonElement;

    expect(button?.getAttribute('aria-label')).toBe('Taille 43');
    await fixture.detectChanges();
  });

  it('updates the selection when the selected attribute changes', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      selected: { id: 'v1', size: '41' },
    });

    expect(componentInstance.selected()?.size).toBe('41');
    componentInstance.selected.set({ id: 'v2', size: '42' });
    await fixture.detectChanges();
    await Promise.resolve();
    await fixture.detectChanges();

    expect(nativeElement.querySelector('.bs-size--selected')?.textContent).toBe('42');
  });

  it('can limit the items displayed when maxItems is set', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      items: [
        { id: 'v1', size: '41', stock: 2 },
        { id: 'v2', size: '42', stock: 2 },
        { id: 'v3', size: '43', stock: 2 },
        { id: 'v4', size: '44', stock: 2 },
      ],
      maxItems: 2,
    });

    expect(componentInstance.visibleItems().length).toBeLessThanOrEqual(2);
    await fixture.detectChanges();
    await Promise.resolve();
    await fixture.detectChanges();
    expect(nativeElement.querySelectorAll('button').length).toBeGreaterThanOrEqual(4);
    expect(componentInstance.visibleItems().length).toBeLessThanOrEqual(2);
  });

  it('shows the overflow label when there are more items than maxItems', async () => {
    const { nativeElement, fixture } = await create({
      items: [
        { id: 'v1', size: '41', stock: 2 },
        { id: 'v2', size: '42', stock: 2 },
        { id: 'v3', size: '43', stock: 2 },
      ],
      maxItems: 2,
    });
    await Promise.resolve();
    await fixture.detectChanges();

    const label = nativeElement.querySelector('.bs-size-selector__more')?.textContent;
    expect(label).toBe('+ 1 autres pointures');
  });

  it('does not crash when items list is empty', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      items: [] as HostSizeSelectorItem[],
      selected: null,
      readonly: false,
      maxItems: null,
      loading: false,
    });
    await fixture.detectChanges();
    await Promise.resolve();
    await fixture.detectChanges();

    expect(componentInstance.visibleItems().length).toBe(0);
    expect(nativeElement.querySelector('button')).toBeNull();
  });

  it('can be readonly and disallow selection', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      readonly: true,
      selected: { id: 'v2', size: '42' },
    });
    const buttons = nativeElement.querySelectorAll('button');

    expect(componentInstance.selected()?.size).toBe('42');
    expect(buttons[0]?.disabled).toBe(false);
    expect(buttons[1]?.disabled).toBe(false);
    expect(nativeElement.textContent).toContain('42');
    await fixture.detectChanges();
    await Promise.resolve();
    await fixture.detectChanges();
    expect(nativeElement.textContent).toContain('42');
  });

  it('does not emit when the component is readonly and a size is clicked', async () => {
    const { nativeElement, componentInstance, fixture } = await create({
      readonly: true,
      selected: null,
    });
    const buttons = nativeElement.querySelectorAll('button');

    buttons.forEach((button) => {
      if (button instanceof HTMLButtonElement && button.textContent?.trim() === '41') {
        button.click();
      }
    });
    await fixture.whenStable?.();
    await Promise.resolve();
    await fixture.detectChanges();

    expect(componentInstance.selected()).toBeNull();
    expect(componentInstance.selectedIds()).toEqual([]);
  });
});

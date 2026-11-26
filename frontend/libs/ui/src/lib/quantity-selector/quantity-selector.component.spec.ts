import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { QuantitySelectorComponent } from './quantity-selector.component';

@Component({
  standalone: true,
  imports: [QuantitySelectorComponent],
  template: `
    <bruny-quantity-selector
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [disabled]="disabled()"
      productName="Mocassin Cuir"
    />
  `,
})
class QuantitySelectorHostComponent {
  readonly value = signal(2);
  readonly min = signal(1);
  readonly max = signal(5);
  readonly disabled = signal(false);
}

describe('QuantitySelectorComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [QuantitySelectorHostComponent] });
    const fixture = TestBed.createComponent(QuantitySelectorHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return {
      fixture,
      host: fixture.componentInstance,
      element: fixture.nativeElement as HTMLElement,
    };
  }

  function button(element: HTMLElement, label: string): HTMLButtonElement {
    return element.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  }

  it('incrémente et décrémente la quantité dans les bornes', async () => {
    const { fixture, host, element } = await create();

    button(element, 'Augmenter la quantité de Mocassin Cuir').click();
    fixture.detectChanges();
    expect(host.value()).toBe(3);
    expect((element.querySelector('.qty-selector__input') as HTMLInputElement).value).toBe('3');

    button(element, 'Diminuer la quantité de Mocassin Cuir').click();
    fixture.detectChanges();
    expect(host.value()).toBe(2);
  });

  it('borne la saisie manuelle entre min et max', async () => {
    const { fixture, host, element } = await create();
    const input = element.querySelector('.qty-selector__input') as HTMLInputElement;

    input.value = '42';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.value()).toBe(5);

    input.value = '0';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.value()).toBe(1);
  });

  it('désactive les boutons aux bornes et affiche le stock maximal', async () => {
    const { fixture, host, element } = await create();
    host.value.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(button(element, 'Augmenter la quantité de Mocassin Cuir').disabled).toBe(true);
    expect(element.textContent).toContain('Quantité maximale disponible (5) atteinte.');

    host.value.set(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button(element, 'Diminuer la quantité de Mocassin Cuir').disabled).toBe(true);
  });

  it('désactive tout le sélecteur quand demandé', async () => {
    const { fixture, host, element } = await create();
    host.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((element.querySelector('.qty-selector__input') as HTMLInputElement).disabled).toBe(true);
    expect(button(element, 'Augmenter la quantité de Mocassin Cuir').disabled).toBe(true);
  });
});

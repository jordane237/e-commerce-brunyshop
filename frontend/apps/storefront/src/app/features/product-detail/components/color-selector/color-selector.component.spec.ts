import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { CatalogColor } from '@bruny/data-access';
import { ColorSelectorComponent, colorHex } from './color-selector.component';

const colors: CatalogColor[] = [
  { color: 'NOIR', slug: 'noir', images: [], availableSizes: ['41'], hasStock: true },
  { color: 'BLANC', slug: 'blanc', images: [], availableSizes: [], hasStock: false },
  { color: 'MARRON', slug: 'marron', images: [], availableSizes: ['42'], hasStock: true },
];

describe('ColorSelectorComponent', () => {
  async function create(selectedColor: string | null = 'noir') {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ColorSelectorComponent] });
    const fixture = TestBed.createComponent(ColorSelectorComponent);
    fixture.componentRef.setInput('colors', colors);
    fixture.componentRef.setInput('selectedColor', selectedColor);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('affiche une pastille par couleur avec le nom accessible', async () => {
    const { element } = await create();

    expect(element.querySelectorAll('.color-selector__swatch')).toHaveLength(3);
    expect(element.textContent?.replace(/\s+/g, ' ')).toContain('Couleur : NOIR');
    expect(element.querySelector('[role="radiogroup"]')).not.toBeNull();
  });

  it('marque la couleur sélectionnée avec aria-checked', async () => {
    const { element } = await create();
    const selected = element.querySelector('.color-selector__swatch--selected');

    expect(selected?.getAttribute('aria-checked')).toBe('true');
    expect(selected?.querySelector('bruny-icon')).not.toBeNull();
  });

  it('désactive une couleur indisponible', async () => {
    const { element } = await create();
    const unavailable = element.querySelectorAll('.color-selector__swatch')[1] as HTMLButtonElement;

    expect(unavailable.disabled).toBe(true);
    expect(unavailable.getAttribute('aria-disabled')).toBe('true');
    expect(unavailable.getAttribute('aria-label')).toBe('Couleur BLANC (indisponible)');
  });

  it('émet le slug au clic sur une couleur disponible', async () => {
    const { fixture, element } = await create();
    let selected: string | null = null;
    fixture.componentInstance.selectColor.subscribe((slug) => (selected = slug));

    (element.querySelectorAll('.color-selector__swatch')[2] as HTMLButtonElement).click();

    expect(selected).toBe('marron');
  });

  it('mappe les couleurs connues et applique un repli neutre', () => {
    expect(colorHex('noir', 'NOIR')).toBe('#111111');
    expect(colorHex('marron', 'MARRON')).toBe('#6b4226');
    expect(colorHex('inconnue', 'INCONNUE')).toBe('#9ca3af');
  });
});

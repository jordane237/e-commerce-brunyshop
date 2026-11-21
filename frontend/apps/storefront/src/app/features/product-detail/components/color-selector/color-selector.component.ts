import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { CatalogColor } from '@bruny/data-access';
import { IconComponent } from '@bruny/ui';

const COLOR_HEX: Record<string, string> = {
  noir: '#111111',
  noir_ebene: '#111111',
  blanc: '#f8f8f8',
  rouge: '#c62828',
  bleu: '#1e3a8a',
  marron: '#6b4226',
  vert: '#2f6b4f',
  orange: '#d97706',
  rose: '#d98ca0',
  gris: '#7b7b7b',
  beige: '#d8c3a5',
  bordeaux: '#6b1f2a',
  camel: '#b98552',
  cognac: '#8b5a2b',
  havane: '#5c3a21',
  dore: '#c89b3c',
  or: '#c89b3c',
  argent: '#b8bcc4',
  violet: '#6b3fa0',
};

export function colorHex(slug: string, color: string): string {
  const normalizedSlug = slug.toLowerCase().replace(/[\s-]+/g, '_');
  const normalizedColor = color
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  if (COLOR_HEX[normalizedSlug] !== undefined) return COLOR_HEX[normalizedSlug];
  if (COLOR_HEX[normalizedColor] !== undefined) return COLOR_HEX[normalizedColor];

  const token = normalizedColor.split('_')[0] ?? '';
  return COLOR_HEX[token] ?? '#9ca3af';
}

@Component({
  selector: 'app-color-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './color-selector.component.html',
  styleUrl: './color-selector.component.scss',
})
export class ColorSelectorComponent {
  readonly colors = input.required<CatalogColor[]>();
  readonly selectedColor = input<string | null>(null);
  readonly selectColor = output<string>();

  readonly selected = computed<CatalogColor | null>(() => {
    const slug = this.selectedColor();
    if (slug === null) return null;
    return this.colors().find((color) => color.slug === slug) ?? null;
  });

  hex(color: CatalogColor): string {
    return colorHex(color.slug, color.color);
  }

  isSelected(color: CatalogColor): boolean {
    return color.slug === this.selectedColor();
  }

  onSelect(color: CatalogColor): void {
    if (!color.hasStock) return;
    this.selectColor.emit(color.slug);
  }

  onKeydown(event: KeyboardEvent): void {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const current = event.target as HTMLElement;
    const group = current.closest('.color-selector__colors');
    if (group === null) return;

    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    const enabled = buttons.filter((button) => !button.disabled);
    if (enabled.length === 0) return;

    event.preventDefault();
    const index = enabled.indexOf(current as HTMLButtonElement);
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = enabled.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % enabled.length;
    } else {
      nextIndex = (index - 1 + enabled.length) % enabled.length;
    }

    const next = enabled[nextIndex];
    next?.focus();
    next?.click();
  }
}

import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SortSelectComponent } from './sort-select.component';

describe('SortSelectComponent', () => {
  it('renders the four backend sorts and emits the selected value', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [SortSelectComponent],
    }).createComponent(SortSelectComponent);
    fixture.componentRef.setInput('value', 'newest');
    fixture.detectChanges();
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.textContent?.trim())).toEqual([
      'Nouveautés',
      'Prix croissant',
      'Prix décroissant',
      'Nom (A–Z)',
    ]);

    let emitted: string | undefined;
    fixture.componentInstance.sortChange.subscribe((value) => (emitted = value));
    select.value = 'price_desc';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toBe('price_desc');
  });
});

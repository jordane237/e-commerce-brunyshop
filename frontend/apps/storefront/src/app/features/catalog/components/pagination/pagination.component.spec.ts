import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PaginationComponent } from './pagination.component';

async function create(page = 1, pages = 3, total = 30) {
  const fixture = TestBed.configureTestingModule({
    imports: [PaginationComponent],
  }).createComponent(PaginationComponent);
  fixture.componentRef.setInput('page', page);
  fixture.componentRef.setInput('pages', pages);
  fixture.componentRef.setInput('total', total);
  fixture.componentRef.setInput('limit', 12);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('PaginationComponent', () => {
  it('shows the loaded count and the mobile "Voir plus" action', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.more__count')?.textContent).toContain('12 produits sur 30');
    expect(element.querySelector('.more__button')?.textContent).toContain('Voir plus');
  });

  it('emits loadMore and hides the action on the last page', async () => {
    const fixture = await create();
    let loaded = false;
    fixture.componentInstance.loadMore.subscribe(() => (loaded = true));

    (fixture.nativeElement.querySelector('.more__button') as HTMLButtonElement).click();
    expect(loaded).toBe(true);

    fixture.componentRef.setInput('page', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.more__button')).toBeNull();
  });

  it('renders the numbered desktop pagination with aria-current', async () => {
    const fixture = await create(2, 3, 30);
    const element = fixture.nativeElement as HTMLElement;
    const current = element.querySelector('[aria-current="page"]');

    expect(current?.textContent?.trim()).toBe('2');
    expect(element.querySelectorAll('.pagination__page')).toHaveLength(3);
    expect(element.querySelector('[aria-label="Page précédente"]')).not.toBeNull();
  });

  it('emits the selected page', async () => {
    const fixture = await create(1, 3, 30);
    let selected: number | undefined;
    fixture.componentInstance.pageChange.subscribe((page) => (selected = page));

    const pages = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('.pagination__page');
    pages[2].click();

    expect(selected).toBe(3);
  });
});

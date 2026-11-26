import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogApi } from '@bruny/data-access';
import { SizeGuideModalComponent } from './size-guide-modal.component';

const guide = {
  id: 'guide-1',
  name: 'Guide chaussures',
  slug: 'chaussures',
  description: null,
  table: {
    men: [{ eu: 42, us: 9, uk: 8, cm: 27 }],
    women: [{ eu: 39, us: 7, uk: 6, cm: 25 }],
    kids: [],
  },
  version: 1,
  publishedAt: null,
};

describe('SizeGuideModalComponent', () => {
  it('se crée sans erreur', () => {
    const sizeGuide = vi.fn(() => of(guide));
    TestBed.configureTestingModule({
      imports: [SizeGuideModalComponent],
      providers: [
        {
          provide: CatalogApi,
          useValue: { sizeGuide, categories: () => of([]), list: () => of({}) },
        },
      ],
    });
    const fixture = TestBed.createComponent(SizeGuideModalComponent);
    fixture.componentRef.setInput('categoryId', 'category-1');
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ne charge pas le guide si la modale est fermée', () => {
    const sizeGuide = vi.fn(() => of(guide));
    TestBed.configureTestingModule({
      imports: [SizeGuideModalComponent],
      providers: [
        {
          provide: CatalogApi,
          useValue: { sizeGuide, categories: () => of([]), list: () => of({}) },
        },
      ],
    });
    const fixture = TestBed.createComponent(SizeGuideModalComponent);
    fixture.componentRef.setInput('categoryId', 'category-1');
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(sizeGuide).not.toHaveBeenCalled();
  });

  it('charge le guide et affiche le tableau à l’ouverture', async () => {
    const sizeGuide = vi.fn(() => of(guide));
    TestBed.configureTestingModule({
      imports: [SizeGuideModalComponent],
      providers: [
        {
          provide: CatalogApi,
          useValue: { sizeGuide, categories: () => of([]), list: () => of({}) },
        },
      ],
    });
    const fixture = TestBed.createComponent(SizeGuideModalComponent);
    fixture.componentRef.setInput('categoryId', 'category-1');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(sizeGuide).toHaveBeenCalledWith('category-1');
    expect(fixture.nativeElement.textContent).toContain('42');
    expect(fixture.nativeElement.textContent).toContain('Comment mesurer votre pied');
    expect(fixture.nativeElement.querySelector('[role="note"]')).not.toBeNull();
  });

  it('affiche les onglets disponibles', async () => {
    const sizeGuide = vi.fn(() => of(guide));
    TestBed.configureTestingModule({
      imports: [SizeGuideModalComponent],
      providers: [
        {
          provide: CatalogApi,
          useValue: { sizeGuide, categories: () => of([]), list: () => of({}) },
        },
      ],
    });
    const fixture = TestBed.createComponent(SizeGuideModalComponent);
    fixture.componentRef.setInput('categoryId', 'category-1');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.availableTabs().map((tab) => tab.label)).toEqual([
      'Homme',
      'Femme',
    ]);
  });

  it('affiche une erreur et permet de réessayer', async () => {
    const sizeGuide = vi.fn(() => throwError(() => new Error('boom')));
    TestBed.configureTestingModule({
      imports: [SizeGuideModalComponent],
      providers: [
        {
          provide: CatalogApi,
          useValue: { sizeGuide, categories: () => of([]), list: () => of({}) },
        },
      ],
    });
    const fixture = TestBed.createComponent(SizeGuideModalComponent);
    fixture.componentRef.setInput('categoryId', 'category-1');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Impossible de charger le guide des tailles',
    );
    expect(fixture.nativeElement.textContent).toContain('Réessayer');

    sizeGuide.mockReturnValue(of(guide));
    fixture.componentInstance.retry();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(sizeGuide).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('42');
  });
});

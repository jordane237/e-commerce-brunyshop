import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { CatalogImage } from '@bruny/data-access';
import { ProductGalleryComponent } from './product-gallery.component';

const images: CatalogImage[] = [
  { id: '1', url: '/1.jpg', alt: 'Vue 1', position: 0, variantColor: null },
  { id: '2', url: '/2.jpg', alt: 'Vue 2', position: 1, variantColor: null },
  { id: '3', url: '/3.jpg', alt: 'Vue 3', position: 2, variantColor: null },
];

describe('ProductGalleryComponent', () => {
  async function create(activeIndex = 0) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ProductGalleryComponent] });
    const fixture = TestBed.createComponent(ProductGalleryComponent);
    fixture.componentRef.setInput('images', images);
    fixture.componentRef.setInput('activeIndex', activeIndex);
    fixture.componentRef.setInput('productName', 'Mocassin Cuir');
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('affiche l’image active, les miniatures et les indicateurs', async () => {
    const { element } = await create(1);
    const main = element.querySelector('.gallery__main-image') as HTMLImageElement;

    expect(main.alt).toBe('Vue 2');
    expect(element.querySelectorAll('.gallery__thumbnail')).toHaveLength(3);
    expect(element.querySelectorAll('.gallery__indicator')).toHaveLength(3);
    expect(element.querySelector('.gallery__counter')?.textContent).toContain('2/3');
  });

  it('marque la miniature active avec aria-current', async () => {
    const { element } = await create(1);
    const active = element.querySelector('.gallery__thumbnail--active');

    expect(active?.getAttribute('aria-current')).toBe('true');
    expect(active?.getAttribute('aria-label')).toBe('Voir la photo 2 sur 3');
  });

  it('émet l’index au clic sur une miniature', async () => {
    const { fixture, element } = await create();
    let selected: number | null = null;
    fixture.componentInstance.setActiveIndex.subscribe((index) => (selected = index));

    (element.querySelectorAll('.gallery__thumbnail')[2] as HTMLButtonElement).click();

    expect(selected).toBe(2);
  });

  it('charge l’image prioritaire en eager', async () => {
    const { element } = await create();
    const main = element.querySelector('.gallery__main-image') as HTMLImageElement;

    expect(main.getAttribute('loading')).toBe('eager');
  });

  it('navigue par swipe tactile horizontal', async () => {
    const { fixture, element } = await create(0);
    const indexes: number[] = [];
    fixture.componentInstance.setActiveIndex.subscribe((index) => indexes.push(index));
    const gallery = fixture.componentInstance;

    gallery.onTouchStart({ changedTouches: [{ clientX: 200 }] } as unknown as TouchEvent);
    gallery.onTouchEnd({ changedTouches: [{ clientX: 80 }] } as unknown as TouchEvent);
    gallery.onTouchStart({ changedTouches: [{ clientX: 80 }] } as unknown as TouchEvent);
    gallery.onTouchEnd({ changedTouches: [{ clientX: 200 }] } as unknown as TouchEvent);

    expect(indexes).toEqual([1]);
    expect(element.querySelector('.gallery__main')).not.toBeNull();
  });

  it('ouvre le zoom au clic sur l’image', async () => {
    const { fixture, element } = await create();
    let opened = 0;
    fixture.componentInstance.openZoom.subscribe(() => (opened += 1));

    (element.querySelector('.gallery__main-button') as HTMLButtonElement).click();

    expect(opened).toBe(1);
  });
});

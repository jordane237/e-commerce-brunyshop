import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { RouteMetaService } from '../../navigation/route-meta.service';
import { BreadcrumbComponent } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  it('renders links and marks the last item as current', async () => {
    const breadcrumbs = signal([
      { label: 'Accueil', url: '/', current: false },
      { label: 'Produits', url: '/produits', current: true },
    ]);
    const fixture = TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [
        provideRouter([]),
        { provide: RouteMetaService, useValue: { breadcrumbs, title: signal('Produits') } },
      ],
    }).createComponent(BreadcrumbComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const items = fixture.nativeElement.querySelectorAll('.breadcrumb__item');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('a')?.getAttribute('href')).toBe('/');
    expect(items[1].querySelector('[aria-current="page"]')?.textContent).toContain('Produits');
  });

  it('renders nothing without breadcrumbs', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [
        provideRouter([]),
        {
          provide: RouteMetaService,
          useValue: { breadcrumbs: signal([]), title: signal('') },
        },
      ],
    }).createComponent(BreadcrumbComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });
});

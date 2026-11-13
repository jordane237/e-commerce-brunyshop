import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it } from 'vitest';
import { RouteMetaService } from './route-meta.service';

@Component({ standalone: true, template: '' })
class EmptyPage {}

describe('RouteMetaService', () => {
  it('reads the deepest title and builds the breadcrumb from route data', async () => {
    TestBed.configureTestingModule({
      providers: [
        RouteMetaService,
        provideRouter([
          {
            path: 'produits',
            component: EmptyPage,
            data: { title: 'Produits', breadcrumb: 'Produits' },
          },
          {
            path: '',
            component: EmptyPage,
            data: { title: 'Tableau de bord', breadcrumb: 'Tableau de bord' },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/produits');
    const meta = TestBed.inject(RouteMetaService);

    expect(meta.title()).toBe('Produits');
    expect(meta.breadcrumbs().map((item) => item.label)).toEqual(['Accueil', 'Produits']);
    expect(meta.breadcrumbs().at(-1)?.current).toBe(true);

    await harness.navigateByUrl('/');

    expect(meta.title()).toBe('Tableau de bord');
    expect(meta.breadcrumbs().map((item) => item.label)).toEqual(['Tableau de bord']);
  });
});

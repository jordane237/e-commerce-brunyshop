import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { LegalPageLayoutComponent, type BreadcrumbItem } from './legal-page-layout.component';

const BREADCRUMB: readonly BreadcrumbItem[] = [
  { label: 'Accueil', path: '/' },
  { label: 'Livraison' },
];

describe('LegalPageLayoutComponent', () => {
  async function create() {
    await TestBed.configureTestingModule({
      imports: [LegalPageLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LegalPageLayoutComponent);
    fixture.componentRef.setInput('title', 'Livraison');
    fixture.componentRef.setInput('eyebrow', 'Informations');
    fixture.componentRef.setInput('intro', 'Une introduction.');
    fixture.componentRef.setInput('lastUpdated', '10 novembre 2026');
    fixture.componentRef.setInput('lastUpdatedIso', '2026-11-10');
    fixture.componentRef.setInput('version', '1.0');
    fixture.componentRef.setInput('breadcrumb', BREADCRUMB);
    fixture.componentRef.setInput('toc', [{ id: 'zones', title: 'Zones', level: 2 }]);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders the editorial header, breadcrumb and last update date', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe('Livraison');
    expect(element.querySelector('.legal-page__eyebrow')?.textContent).toBe('Informations');
    expect(element.querySelector('.legal-page__intro')?.textContent).toBe('Une introduction.');
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-10');
    expect(element.querySelector('.legal-page__meta')?.textContent).toContain('Version 1.0');

    const current = element.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe('Livraison');
    expect(element.querySelector('.breadcrumb a')?.getAttribute('href')).toBe('/');
  });

  it('renders the summary, the projected content and the support email', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('bruny-table-of-contents')).not.toBeNull();
    expect(element.querySelector('.prose')).not.toBeNull();
    const link = element.querySelector('a[href^="mailto:"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('mailto:support@brunyshop.cm');
    expect(link.textContent).toContain('support@brunyshop.cm');
  });
});

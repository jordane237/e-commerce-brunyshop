import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { CgvComponent } from './cgv.component';

describe('CgvComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CgvComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(CgvComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the twelve articles and the version metadata', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('section')).toHaveLength(12);
    expect(element.textContent).toContain('Article 1 — Objet');
    expect(element.textContent).toContain('Article 12 — Version');
    expect(element.textContent).toContain('Version 1.0, en vigueur au 10 novembre 2026.');
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-10');
  });

  it('links to the delivery, returns and privacy pages', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(element.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/livraison',
        '/retours',
        '/politique-confidentialite',
        '/mentions-legales',
      ]),
    );
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalPath: '/cgv',
        title: 'Conditions générales de vente',
      }),
    );
  });
});

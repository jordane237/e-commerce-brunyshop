import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('sets the document title and description with the site suffix', () => {
    const service = TestBed.inject(SeoService);

    service.setPageMeta({
      title: 'FAQ',
      description: 'Les réponses aux questions fréquentes.',
      canonicalPath: '/faq',
    });

    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);
    expect(title.getTitle()).toBe('FAQ | BRUNY SHOPPING');
    expect(meta.getTag('name="description"')?.content).toBe(
      'Les réponses aux questions fréquentes.',
    );
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
  });

  it('uses the production site URL for the canonical and Open Graph tags', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);

    service.setPageMeta({
      title: 'Livraison',
      description: 'Zones et frais.',
      canonicalPath: '/livraison',
    });

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://brunyshop.cm/livraison',
    );
    expect(meta.getTag('property="og:url"')?.content).toBe('https://brunyshop.cm/livraison');
    expect(meta.getTag('property="og:site_name"')?.content).toBe('BRUNY SHOPPING');
    expect(meta.getTag('property="og:locale"')?.content).toBe('fr_CM');
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
    expect(meta.getTag('name="twitter:title"')?.content).toBe('Livraison | BRUNY SHOPPING');
  });

  it('marks noindex pages explicitly', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);

    service.setPageMeta({
      title: 'Page privée',
      description: 'Contenu privé.',
      canonicalPath: '/compte',
      noIndex: true,
    });

    expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });
});

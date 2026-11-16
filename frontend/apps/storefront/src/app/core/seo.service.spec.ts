import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    document.querySelectorAll('script#bruny-jsonld').forEach((script) => script.remove());
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

  it('sets the Open Graph type, image and Twitter image', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);

    service.setPageMeta({
      title: 'Baskets urbaines',
      description: 'Une paire pour la ville.',
      canonicalPath: '/produit/baskets-urbaines',
      ogType: 'product',
      ogImage: '/images/baskets-urbaines.jpg',
      ogImageAlt: 'Baskets urbaines blanches',
    });

    expect(meta.getTag('property="og:type"')?.content).toBe('product');
    expect(meta.getTag('property="og:image"')?.content).toBe(
      'https://brunyshop.cm/images/baskets-urbaines.jpg',
    );
    expect(meta.getTag('property="og:image:alt"')?.content).toBe('Baskets urbaines blanches');
    expect(meta.getTag('name="twitter:image"')?.content).toBe(
      'https://brunyshop.cm/images/baskets-urbaines.jpg',
    );
  });

  it('renders a single valid JSON-LD script and replaces it on navigation', () => {
    const service = TestBed.inject(SeoService);

    service.setPageMeta({
      title: 'Accueil',
      description: 'La boutique.',
      canonicalPath: '/',
      jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'BRUNY SHOPPING' },
    });

    const first = document.querySelectorAll<HTMLScriptElement>('script#bruny-jsonld');
    expect(first).toHaveLength(1);
    expect(first[0].type).toBe('application/ld+json');
    expect(JSON.parse(first[0].textContent ?? '')).toMatchObject({
      '@type': 'WebSite',
      name: 'BRUNY SHOPPING',
    });

    service.setPageMeta({
      title: 'FAQ',
      description: 'Les questions.',
      canonicalPath: '/faq',
      jsonLd: { '@context': 'https://schema.org', '@type': 'FAQPage' },
    });

    const scripts = document.querySelectorAll<HTMLScriptElement>('script#bruny-jsonld');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '')).toMatchObject({ '@type': 'FAQPage' });
  });

  it('removes the JSON-LD script when a page has no structured data', () => {
    const service = TestBed.inject(SeoService);

    service.setPageMeta({
      title: 'Accueil',
      description: 'La boutique.',
      canonicalPath: '/',
      jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite' },
    });
    service.setPageMeta({
      title: 'Connexion',
      description: 'Connexion.',
      canonicalPath: '/connexion',
    });

    expect(document.querySelectorAll('script#bruny-jsonld')).toHaveLength(0);
  });

  it('escapes closing script tags inside JSON-LD content', () => {
    const service = TestBed.inject(SeoService);

    service.setPageMeta({
      title: 'Produit',
      description: 'Description.',
      canonicalPath: '/produit/test',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        description: 'Une semelle </script><script>alert(1)</script>',
      },
    });

    const script = document.querySelector<HTMLScriptElement>('script#bruny-jsonld');
    expect(script?.textContent).not.toContain('</script>');
    expect(script?.textContent).toContain('\\u003c/script>');
    expect(JSON.parse(script?.textContent ?? '')).toMatchObject({
      description: 'Une semelle </script><script>alert(1)</script>',
    });
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

import type { CatalogProductDetail } from '@bruny/data-access';
import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_CONFIG } from './app-config';
import {
  aboutPageSchema,
  collectionPageSchema,
  contactPageSchema,
  faqPageSchema,
  homeSchema,
  productSchema,
} from './structured-data';

const product = {
  name: 'Baskets urbaines',
  description: 'Une paire pour la ville.',
  effectivePrice: 45000,
  inStock: true,
  images: [{ url: '/images/baskets.jpg' }],
  category: { name: 'Baskets' },
  brand: { name: 'BRUNY' },
  variants: [{ sku: 'BRU-001-42' }],
} as unknown as CatalogProductDetail;

describe('structured data', () => {
  it('describes the home page as a WebSite and Organization', () => {
    const schema = homeSchema(DEFAULT_APP_CONFIG);

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', url: 'https://brunyshop.cm', inLanguage: 'fr-CM' },
        {
          '@type': 'Organization',
          email: 'support@brunyshop.cm',
          contactPoint: { telephone: '+237679176296', areaServed: 'CM' },
        },
      ],
    });
  });

  it('builds absolute collection and simple page URLs', () => {
    const collection = collectionPageSchema(
      DEFAULT_APP_CONFIG,
      'Baskets',
      'Les baskets disponibles.',
      '/boutique',
    );
    const about = aboutPageSchema(DEFAULT_APP_CONFIG, 'Notre histoire.');
    const contact = contactPageSchema(DEFAULT_APP_CONFIG, 'Nous contacter.');

    expect(collection).toMatchObject({
      '@type': 'CollectionPage',
      url: 'https://brunyshop.cm/boutique',
    });
    expect(about).toMatchObject({
      '@type': 'AboutPage',
      url: 'https://brunyshop.cm/a-propos',
    });
    expect(contact).toMatchObject({
      '@type': 'ContactPage',
      url: 'https://brunyshop.cm/contact',
    });
  });

  it('describes a product with its first SKU, image and price', () => {
    const schema = productSchema(DEFAULT_APP_CONFIG, product, '/produit/baskets-urbaines');

    expect(schema).toMatchObject({
      '@type': 'Product',
      sku: 'BRU-001-42',
      image: ['https://brunyshop.cm/images/baskets.jpg'],
      brand: { '@type': 'Brand', name: 'BRUNY' },
      offers: {
        price: 45000,
        priceCurrency: 'XAF',
        availability: 'https://schema.org/InStock',
      },
    });
  });

  it('lists every FAQ entry as a structured question', () => {
    const schema = faqPageSchema(DEFAULT_APP_CONFIG, 'Les questions fréquentes.', [
      { question: 'Où livrez-vous ?', answer: 'À Douala et Yaoundé.' },
      { question: 'Quels sont les frais ?', answer: 'À partir de 1 500 FCFA.' },
    ]);

    expect(schema).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Où livrez-vous ?',
          acceptedAnswer: { '@type': 'Answer', text: 'À Douala et Yaoundé.' },
        },
        {
          '@type': 'Question',
          name: 'Quels sont les frais ?',
          acceptedAnswer: { '@type': 'Answer', text: 'À partir de 1 500 FCFA.' },
        },
      ],
    });
  });
});

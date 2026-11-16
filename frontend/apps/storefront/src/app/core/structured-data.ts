import type { CatalogProductDetail } from '@bruny/data-access';
import type { AppConfig } from './app-config';

const CONTEXT = 'https://schema.org';

export function homeSchema(config: AppConfig): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'WebSite',
        name: config.siteName,
        url: config.siteUrl,
        inLanguage: 'fr-CM',
      },
      {
        '@type': 'Organization',
        name: config.siteName,
        url: config.siteUrl,
        email: config.supportEmail,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: config.contactPhone,
          contactType: 'service client',
          areaServed: 'CM',
          availableLanguage: 'fr',
        },
      },
    ],
  };
}

export function collectionPageSchema(
  config: AppConfig,
  name: string,
  description: string,
  path: string,
): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': 'CollectionPage',
    name,
    description,
    url: new URL(path, config.siteUrl).toString(),
    inLanguage: 'fr-CM',
    isPartOf: { '@type': 'WebSite', name: config.siteName, url: config.siteUrl },
  };
}

export function productSchema(
  config: AppConfig,
  product: CatalogProductDetail,
  path: string,
): Record<string, unknown> {
  const url = new URL(path, config.siteUrl).toString();
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((image) => new URL(image.url, config.siteUrl).toString()),
    sku: product.variants[0]?.sku,
    category: product.category.name,
    brand: { '@type': 'Brand', name: product.brand.name },
    offers: {
      '@type': 'Offer',
      url,
      price: product.effectivePrice,
      priceCurrency: 'XAF',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}

export function aboutPageSchema(config: AppConfig, description: string): Record<string, unknown> {
  return simplePageSchema(config, 'AboutPage', 'À propos', description, '/a-propos');
}

export function contactPageSchema(config: AppConfig, description: string): Record<string, unknown> {
  return simplePageSchema(config, 'ContactPage', 'Contact', description, '/contact');
}

export function faqPageSchema(
  config: AppConfig,
  description: string,
  items: readonly { readonly question: string; readonly answer: string }[],
): Record<string, unknown> {
  return {
    ...simplePageSchema(config, 'FAQPage', 'Questions fréquentes', description, '/faq'),
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function simplePageSchema(
  config: AppConfig,
  type: string,
  name: string,
  description: string,
  path: string,
): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': type,
    name,
    description,
    url: new URL(path, config.siteUrl).toString(),
    inLanguage: 'fr-CM',
    isPartOf: { '@type': 'WebSite', name: config.siteName, url: config.siteUrl },
  };
}

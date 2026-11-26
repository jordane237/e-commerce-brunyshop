import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { APP_CONFIG, DEFAULT_APP_CONFIG, type AppConfig } from '../app-config';
import { isTunnelUrl, resolveWhatsAppContext, WhatsAppService } from './whatsapp.service';

function createService(overrides: Partial<AppConfig> = {}): WhatsAppService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: APP_CONFIG,
        useValue: { ...DEFAULT_APP_CONFIG, ...overrides },
      },
    ],
  });
  return TestBed.inject(WhatsAppService);
}

function linkUrl(link: string | null): URL {
  expect(link).not.toBeNull();
  return new URL(link ?? '');
}

function messageOf(link: string | null): string {
  return linkUrl(link).searchParams.get('text') ?? '';
}

describe('WhatsAppService', () => {
  it('construit un lien wa.me avec le message de la page d’accueil', () => {
    const service = createService();

    const link = service.buildLink({ page: 'home' });

    expect(linkUrl(link).origin).toBe('https://wa.me');
    expect(linkUrl(link).pathname).toBe('/237679176296');
    expect(messageOf(link)).toBe(
      "Bonjour BRUNY SHOPPING, je visite votre boutique et j'ai une question.",
    );
  });

  it('ajoute le nom du produit et la variante au message produit', () => {
    const service = createService();

    const message = service.buildMessage({
      page: 'product',
      productName: 'Mocassin Cuir',
      variant: 'Noir / 41',
    });

    expect(message).toContain('Mocassin Cuir');
    expect(message).toContain('Noir / 41');
    expect(message).toContain("je m'intéresse au produit");
  });

  it('ajoute la référence de commande au message de confirmation', () => {
    const service = createService();

    expect(
      service.buildMessage({ page: 'confirmation', orderReference: 'BRN-2611-7K3F' }),
    ).toContain('BRN-2611-7K3F');
  });

  it('ajoute la catégorie au message de catalogue', () => {
    const service = createService();

    expect(service.buildMessage({ page: 'catalog', categoryName: 'Mocassins' })).toContain(
      'rubrique Mocassins',
    );
  });

  it('normalise le numéro trouvé dans contactWhatsappUrl', () => {
    const service = createService({
      contactWhatsappUrl: 'https://wa.me/237-600-000-000?text=ancien',
    });

    const link = service.buildLink({ page: 'other' });

    expect(service.configured).toBe(true);
    expect(linkUrl(link).pathname).toBe('/237600000000');
  });

  it('refuse une configuration vide ou non numérique', () => {
    expect(
      createService({ contactWhatsappUrl: 'https://wa.me/CHANGEME' }).buildLink({ page: 'home' }),
    ).toBeNull();
    expect(createService({ contactWhatsappUrl: '' }).buildLink({ page: 'home' })).toBeNull();
  });

  it('encode les accents dans le paramètre text', () => {
    const service = createService();

    const link = service.buildLink({
      page: 'product',
      productName: 'Mocassin Cuir',
    });

    expect(link).toContain('int%C3%A9resse');
    expect(messageOf(link)).toContain('intéresse');
  });
});

describe('contexte WhatsApp déduit de l’URL', () => {
  it('reconnaît l’accueil, la boutique et la fiche produit', () => {
    expect(resolveWhatsAppContext('/')).toEqual({ page: 'home' });
    expect(resolveWhatsAppContext('/boutique?q=noir')).toEqual({ page: 'catalog' });
    expect(resolveWhatsAppContext('/produit/mocassin-cuir')).toEqual({ page: 'product' });
  });

  it('reconnaît le panier et la page contact', () => {
    expect(resolveWhatsAppContext('/panier')).toEqual({ page: 'cart' });
    expect(resolveWhatsAppContext('/contact')).toEqual({ page: 'contact' });
  });

  it('reconnaît les routes du tunnel et de confirmation', () => {
    expect(resolveWhatsAppContext('/commande/paiement')).toEqual({ page: 'checkout' });
    expect(resolveWhatsAppContext('/paiement')).toEqual({ page: 'confirmation' });
    expect(resolveWhatsAppContext('/confirmation')).toEqual({ page: 'confirmation' });
  });

  it('ne confond pas une route préfixée avec un segment du tunnel', () => {
    expect(isTunnelUrl('/commande')).toBe(true);
    expect(isTunnelUrl('/commande/paiement')).toBe(true);
    expect(isTunnelUrl('/suivi?ref=BRN-2611-7K3F')).toBe(true);
    expect(isTunnelUrl('/confirmation-newsletter')).toBe(false);
    expect(isTunnelUrl('/boutique')).toBe(false);
  });
});

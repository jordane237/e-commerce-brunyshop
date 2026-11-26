import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../app-config';

export type WhatsAppPage =
  | 'home'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'confirmation'
  | 'account'
  | 'size-guide'
  | 'contact'
  | 'other';

export interface WhatsAppContext {
  readonly page: WhatsAppPage;
  readonly productName?: string;
  readonly variant?: string;
  readonly categoryName?: string;
  readonly orderReference?: string;
}

const TUNNEL_PREFIXES = ['/commande', '/checkout', '/paiement', '/confirmation', '/suivi'] as const;

/** Retire la query string, le fragment et le slash final. */
function normalizedPath(url: string): string {
  const path = url.split(/[?#]/, 1)[0] ?? '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path === '' ? '/' : path;
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Vrai pour les écrans du tunnel de paiement. La comparaison porte sur un
 * segment complet : `/confirmation-newsletter` ne doit pas être traité comme
 * une page de confirmation de commande.
 */
export function isTunnelUrl(url: string): boolean {
  const path = normalizedPath(url);
  return TUNNEL_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

/** Contexte de message déduit de l'URL réelle du storefront. */
export function resolveWhatsAppContext(url: string): WhatsAppContext {
  const path = normalizedPath(url);

  if (path === '/') return { page: 'home' };
  if (matchesPrefix(path, '/boutique')) return { page: 'catalog' };
  if (matchesPrefix(path, '/produit')) return { page: 'product' };
  if (matchesPrefix(path, '/panier')) return { page: 'cart' };
  if (matchesPrefix(path, '/commande') || matchesPrefix(path, '/checkout')) {
    return { page: 'checkout' };
  }
  if (
    matchesPrefix(path, '/paiement') ||
    matchesPrefix(path, '/confirmation') ||
    matchesPrefix(path, '/suivi')
  ) {
    return { page: 'confirmation' };
  }
  if (
    matchesPrefix(path, '/compte') ||
    matchesPrefix(path, '/connexion') ||
    matchesPrefix(path, '/inscription')
  ) {
    return { page: 'account' };
  }
  if (matchesPrefix(path, '/guide-des-tailles')) return { page: 'size-guide' };
  if (matchesPrefix(path, '/contact')) return { page: 'contact' };
  return { page: 'other' };
}

/**
 * Extrait le numéro depuis l'URL existante `contactWhatsappUrl`.
 *
 * Le dépôt n'a pas de fichier `environment.ts` et n'expose pas encore ce
 * réglage via l'API publique. On garde donc `APP_CONFIG.contactWhatsappUrl`
 * comme source de vérité unique, sans dupliquer le numéro dans une seconde
 * propriété.
 */
function extractPhone(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return null;

  try {
    const url = new URL(value);
    const queryPhone = url.searchParams.get('phone')?.replace(/\D/g, '') ?? '';
    const pathPhone = url.pathname.replace(/\D/g, '');
    const digits = (pathPhone || queryPhone).slice(0, 15);
    return /^\d{8,15}$/.test(digits) ? digits : null;
  } catch {
    const digits = value.replace(/\D/g, '').slice(0, 15);
    return /^\d{8,15}$/.test(digits) ? digits : null;
  }
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly config = inject(APP_CONFIG);
  private readonly phone = extractPhone(this.config.contactWhatsappUrl);

  /** Aucun lien n'est construit si le numéro est vide ou invalide. */
  readonly configured = this.phone !== null;

  buildLink(context: WhatsAppContext): string | null {
    if (this.phone === null) return null;

    const message = this.buildMessage(context);
    return `https://wa.me/${this.phone}?text=${encodeURIComponent(message)}`;
  }

  buildMessage(context: WhatsAppContext): string {
    const base = 'Bonjour BRUNY SHOPPING,';

    switch (context.page) {
      case 'home':
        return `${base} je visite votre boutique et j'ai une question.`;
      case 'catalog':
        return context.categoryName
          ? `${base} je parcours la rubrique ${context.categoryName} de votre boutique et j'ai une question.`
          : `${base} je parcours votre boutique et j'ai une question.`;
      case 'product': {
        if (context.productName) {
          const variant = context.variant ? ` (${context.variant})` : '';
          return `${base} je m'intéresse au produit "${context.productName}"${variant}. Pouvez-vous m'aider ?`;
        }
        return `${base} je m'intéresse à un produit de votre boutique. Pouvez-vous m'aider ?`;
      }
      case 'cart':
        return `${base} j'ai une question sur mon panier.`;
      case 'checkout':
        return `${base} j'ai besoin d'aide pour finaliser ma commande.`;
      case 'confirmation':
        return context.orderReference
          ? `${base} j'ai une question sur ma commande ${context.orderReference}.`
          : `${base} j'ai une question sur ma commande.`;
      case 'account':
        return `${base} j'ai une question sur mon compte.`;
      case 'size-guide':
        return `${base} j'ai une question sur les pointures.`;
      case 'contact':
        return `${base} je souhaite vous contacter.`;
      case 'other':
      default:
        return `${base} j'ai une question.`;
    }
  }
}

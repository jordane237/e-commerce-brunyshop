import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  Injector,
  isDevMode,
  PLATFORM_ID,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { CatalogProductDetail } from '@bruny/data-access';
import { APP_CONFIG } from '../app-config';
import { ConsentService } from './consent.service';

type ProductVariant = CatalogProductDetail['variants'][number];

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: FbqFunction;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    /** Surcharge de test, uniquement lue en mode développement. */
    __BRUNY_META_PIXEL_ID__?: string;
  }
}

export interface CheckoutCart {
  items: { sku: string; quantity: number }[];
  total: number;
}

export interface PurchaseOrder {
  reference: string;
  total: number;
  items: { sku: string; quantity: number }[];
}

const PURCHASE_STORAGE_PREFIX = 'brunyshop.pixel.purchase.';
const PLACEHOLDER_PREFIX = 'CHANGEME_';

/**
 * Pixel Meta côté navigateur.
 *
 * Aucun script n'est chargé tant que le consentement marketing n'est pas
 * explicite. Le service ne transmet aucune donnée personnelle : uniquement des
 * SKU, montants XAF, quantités et la référence de commande.
 */
@Injectable({ providedIn: 'root' })
export class MetaPixelService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly config = inject(APP_CONFIG);
  private readonly consent = inject(ConsentService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private started = false;
  private initialized = false;
  private purchaseEventSent = false;

  start(): void {
    if (!this.browser || this.started) return;
    this.started = true;

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.initialized) this.trackPageView();
      });

    effect(
      () => {
        this.syncConsent();
      },
      { injector: this.injector },
    );
  }

  /** Applique l'état de consentement courant (aussi utilisé par les tests). */
  syncConsent(): void {
    if (!this.browser) return;
    if (this.consent.marketingConsent()) {
      this.initialize();
    } else {
      this.revoke();
    }
  }

  trackViewContent(product: CatalogProductDetail): void {
    const contentIds = [...new Set(product.variants.map((variant) => variant.sku))];
    this.track('ViewContent', {
      content_name: product.name,
      content_ids: contentIds,
      content_type: 'product',
      value: product.effectivePrice,
      currency: 'XAF',
    });
  }

  trackAddToCart(product: CatalogProductDetail, variant: ProductVariant, quantity: number): void {
    this.track('AddToCart', {
      content_name: product.name,
      content_ids: [variant.sku],
      content_type: 'product',
      value: variant.effectivePrice * quantity,
      currency: 'XAF',
      num_items: quantity,
    });
  }

  trackInitiateCheckout(cart: CheckoutCart): void {
    this.track('InitiateCheckout', {
      content_ids: cart.items.map((item) => item.sku),
      value: cart.total,
      currency: 'XAF',
      num_items: cart.items.reduce((total, item) => total + item.quantity, 0),
    });
  }

  /**
   * Purchase ne part qu'une fois par référence : garde session + marqueur
   * localStorage, qui survit au rechargement de la page de confirmation.
   */
  trackPurchaseOnce(order: PurchaseOrder): void {
    if (!this.canTrack() || this.purchaseEventSent) return;

    const storageKey = `${PURCHASE_STORAGE_PREFIX}${encodeURIComponent(order.reference)}`;
    if (this.browser) {
      try {
        if (localStorage.getItem(storageKey) !== null) return;
      } catch {
        // Sans stockage, la garde de session reste active.
      }
    }

    const sent = this.track('Purchase', {
      content_ids: order.items.map((item) => item.sku),
      value: order.total,
      currency: 'XAF',
      num_items: order.items.reduce((total, item) => total + item.quantity, 0),
      order_id: order.reference,
    });
    if (!sent) return;

    this.purchaseEventSent = true;
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // Le flag de session suffit pour cette visite.
    }
  }

  private initialize(): void {
    if (!this.browser || this.initialized) return;

    const pixelId = this.pixelId();
    if (pixelId === null) return;

    this.injectFbq();
    window.fbq?.('init', pixelId);
    this.initialized = true;
    this.trackPageView();
  }

  private revoke(): void {
    if (!this.browser) return;
    this.initialized = false;
    this.purchaseEventSent = false;
    this.clearPixelCookies();
  }

  private track(eventName: string, parameters: Record<string, unknown>): boolean {
    if (!this.canTrack()) return false;
    if (!this.initialized) this.initialize();
    if (!this.initialized) return false;

    window.fbq?.('track', eventName, parameters);
    return true;
  }

  private trackPageView(): void {
    window.fbq?.('track', 'PageView');
  }

  private canTrack(): boolean {
    return this.browser && this.consent.marketingConsent();
  }

  private pixelId(): string | null {
    const override = isDevMode() ? window.__BRUNY_META_PIXEL_ID__ : undefined;
    const pixelId = override ?? this.config.metaPixelId;
    if (pixelId === null || pixelId.trim() === '') return null;
    if (pixelId.startsWith(PLACEHOLDER_PREFIX)) return null;
    return pixelId;
  }

  /** Snippet officiel Meta, sans dépendance externe. */
  private injectFbq(): void {
    if (window.fbq !== undefined) return;

    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod !== undefined) {
        fbq.callMethod(...args);
      } else {
        fbq.queue.push(args);
      }
    }) as FbqFunction;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  private clearPixelCookies(): void {
    const hostname = window.location.hostname;
    const domains = new Set<string>(['', hostname, `.${hostname}`]);
    const labels = hostname.split('.');
    if (labels.length > 2) {
      domains.add(`.${labels.slice(-2).join('.')}`);
    }

    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0]?.trim();
      if (name === undefined || (!name.startsWith('_fbp') && !name.startsWith('_fbc'))) continue;

      for (const domain of domains) {
        const domainPart = domain === '' ? '' : `; domain=${domain}`;
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domainPart}`;
      }
    }
  }
}

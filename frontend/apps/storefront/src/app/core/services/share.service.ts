import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { from, Observable, of } from 'rxjs';

export interface SharePayload {
  readonly url: string;
  readonly title: string;
  readonly description?: string;
  readonly imageUrl?: string;
}

/**
 * Partage d'un produit (CAT-11).
 *
 * SSR-safe : toutes les interactions navigateur sont gardées par
 * `isPlatformBrowser`. Les popups utilisent `noopener,noreferrer`.
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  shareOnFacebook(payload: SharePayload): void {
    if (!this.isBrowser) return;
    const url = encodeURIComponent(payload.url);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'noopener,noreferrer,width=600,height=600',
    );
  }

  shareOnWhatsApp(payload: SharePayload): void {
    if (!this.isBrowser) return;
    const message = `Regarde ce produit sur BrunyShop : ${payload.title} — ${payload.url}`;
    const encoded = encodeURIComponent(message);
    window.open(
      `https://wa.me/?text=${encoded}`,
      '_blank',
      'noopener,noreferrer,width=600,height=600',
    );
  }

  copyLink(url: string): Observable<boolean> {
    if (!this.isBrowser) return of(false);

    return from(
      (async (): Promise<boolean> => {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
            return true;
          }

          const textarea = document.createElement('textarea');
          textarea.value = url;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textarea);
          return success;
        } catch {
          return false;
        }
      })(),
    );
  }

  async shareNative(payload: SharePayload): Promise<boolean> {
    if (!this.isBrowser || typeof navigator.share !== 'function') return false;
    try {
      await navigator.share({
        title: payload.title,
        text: payload.description ?? payload.title,
        url: payload.url,
      });
      return true;
    } catch {
      return false;
    }
  }
}

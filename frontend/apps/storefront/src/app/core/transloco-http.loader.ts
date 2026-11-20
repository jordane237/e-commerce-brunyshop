import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, REQUEST, inject } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import type { Observable } from 'rxjs';
import { APP_CONFIG } from './app-config';

/**
 * Charge les traductions depuis `/i18n/<lang>.json` (dossier public).
 * En SSR, une URL relative n'est pas acceptée par le backend HTTP : on la
 * résout avec l'origine de la requête, ou avec l'URL publique en repli.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly config = inject(APP_CONFIG);

  getTranslation(lang: string): Observable<Translation> {
    const origin = isPlatformBrowser(this.platformId)
      ? ''
      : this.request?.url
        ? new URL(this.request.url).origin
        : this.config.siteUrl;
    return this.http.get<Translation>(`${origin}/i18n/${lang}.json`);
  }
}

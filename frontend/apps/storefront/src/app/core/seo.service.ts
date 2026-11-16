import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { APP_CONFIG } from './app-config';

export interface PageMetaOptions {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath?: string;
  readonly ogImage?: string;
  readonly noIndex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(APP_CONFIG);

  /**
   * Signature historique conservée pour les pages CAT-07/CAT-08/CAT-03.
   */
  set(title: string, description: string, path: string): void {
    this.setPageMeta({ title, description, canonicalPath: path });
  }

  /**
   * Met à jour toutes les balises SEO de la page. `Title` et `Meta` sont
   * rendus côté serveur : le HTML SSR contient bien les balises finales.
   */
  setPageMeta(options: PageMetaOptions): void {
    const fullTitle = `${options.title} | ${this.config.siteName}`;
    const canonicalPath = options.canonicalPath ?? this.currentPath();
    const canonicalUrl = this.absoluteUrl(canonicalPath);
    const image = options.ogImage ?? this.config.defaultOgImage;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: options.description });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: options.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.config.siteName });
    this.meta.updateTag({ property: 'og:locale', content: 'fr_CM' });
    if (image !== null && image !== '') {
      this.meta.updateTag({ property: 'og:image', content: this.absoluteUrl(image) });
    } else {
      this.meta.removeTag('property="og:image"');
    }

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: options.description });

    this.meta.updateTag({
      name: 'robots',
      content: options.noIndex === true ? 'noindex, nofollow' : 'index, follow',
    });

    this.setCanonical(canonicalUrl);
  }

  private currentPath(): string {
    return this.document.location?.pathname ?? '/';
  }

  private absoluteUrl(path: string): string {
    try {
      return new URL(path, this.config.siteUrl).toString();
    } catch {
      return this.config.siteUrl;
    }
  }

  private setCanonical(url: string): void {
    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}

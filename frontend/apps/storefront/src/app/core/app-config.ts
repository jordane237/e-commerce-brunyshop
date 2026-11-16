import { InjectionToken } from '@angular/core';

export interface AppConfig {
  readonly siteName: string;
  readonly siteUrl: string;
  readonly supportEmail: string;
  readonly contactWhatsappUrl: string;
  readonly contactPhone: string;
  readonly contactPhoneDisplay: string;
  readonly contactFacebookUrl: string;
  readonly defaultOgImage: string | null;
}

/**
 * Valeurs de production. Aucun fichier `environment.ts` n'existe dans ce
 * dépôt : la configuration SEO est fournie au boot par `app.config.ts`.
 * L'URL canonique ne doit jamais dépendre de l'origine de la requête SSR
 * (`localhost` en développement), sinon les moteurs indexent la mauvaise URL.
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  siteName: 'BRUNY SHOPPING',
  siteUrl: 'https://brunyshop.cm',
  supportEmail: 'support@brunyshop.cm',
  contactWhatsappUrl: 'https://wa.me/237600000000',
  contactPhone: '+237600000000',
  contactPhoneDisplay: '+237 6 00 00 00 00',
  contactFacebookUrl: 'https://www.facebook.com/BrunyShopping',
  defaultOgImage: null,
};

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_APP_CONFIG,
});

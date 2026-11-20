import { registerLocaleData } from '@angular/common';
import localeFrCm from '@angular/common/locales/fr-CM';
import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  AUTH_FORBIDDEN_PATH,
  AUTH_HOME_PATH,
  AUTH_LOGIN_PATH,
  authInterceptor,
  errorInterceptor,
  GlobalErrorHandler,
  loadingInterceptor,
  requestIdInterceptor,
  SessionRestoreService,
} from '@bruny/core';
import { API_BASE_URL } from '@bruny/data-access';
import { APP_CONFIG, DEFAULT_APP_CONFIG } from './core/app-config';
import { TranslocoHttpLoader } from './core/transloco-http.loader';

registerLocaleData(localeFrCm, 'fr-CM');

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    // Order: request id → auth/refresh → loading → user-facing errors.
    provideHttpClient(
      withFetch(),
      withInterceptors([
        requestIdInterceptor,
        authInterceptor,
        loadingInterceptor,
        errorInterceptor,
      ]),
    ),
    { provide: API_BASE_URL, useValue: '/api/v1' },
    { provide: APP_CONFIG, useValue: DEFAULT_APP_CONFIG },
    { provide: LOCALE_ID, useValue: 'fr-CM' },
    provideTransloco({
      config: {
        availableLangs: ['fr-CM', 'en'],
        defaultLang: 'fr-CM',
        fallbackLang: 'fr-CM',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    { provide: AUTH_LOGIN_PATH, useValue: '/connexion' },
    { provide: AUTH_FORBIDDEN_PATH, useValue: '/403' },
    { provide: AUTH_HOME_PATH, useValue: '/compte' },
    provideAppInitializer(() => inject(SessionRestoreService).restore()),
    provideAppInitializer(() => inject(TranslocoService).load('fr-CM')),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};

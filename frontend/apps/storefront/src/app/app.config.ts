import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
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
    { provide: AUTH_LOGIN_PATH, useValue: '/connexion' },
    { provide: AUTH_FORBIDDEN_PATH, useValue: '/403' },
    { provide: AUTH_HOME_PATH, useValue: '/compte' },
    provideAppInitializer(() => inject(SessionRestoreService).restore()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};

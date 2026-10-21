import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  API_BASE_URL,
  errorInterceptor,
  loadingInterceptor,
  requestInterceptor,
} from '@bruny/data-access';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(
      withFetch(),
      withInterceptors([requestInterceptor, errorInterceptor, loadingInterceptor]),
    ),
    { provide: API_BASE_URL, useValue: '/api/v1' },
  ],
};

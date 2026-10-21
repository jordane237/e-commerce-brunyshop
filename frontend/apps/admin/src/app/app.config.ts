import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { errorInterceptor, requestInterceptor } from './core/http';
import { API_BASE_URL } from '@bruny/data-access';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([requestInterceptor, errorInterceptor, loadingInterceptor])),
    { provide: API_BASE_URL, useValue: '/api/v1' },
  ],
};

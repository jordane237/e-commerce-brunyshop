import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE_URL } from '@bruny/data-access';
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';

const internalApiUrl = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000/api/v1';
const internalApiOrigin = new URL(internalApiUrl).origin;
const publicAppUrl = process.env['APP_PUBLIC_URL'] ?? 'http://localhost:4200';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: API_BASE_URL, useValue: internalApiUrl },
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useValue: { [internalApiOrigin]: publicAppUrl },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

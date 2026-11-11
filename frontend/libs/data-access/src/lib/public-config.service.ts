import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, shareReplay, throwError } from 'rxjs';

import { API_BASE_URL } from './catalog-api';

export interface PublicConfig {
  turnstileEnabled: boolean;
  turnstileSiteKey: string | null;
}

@Injectable({ providedIn: 'root' })
export class PublicConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private cache?: Observable<PublicConfig>;

  getConfig(): Observable<PublicConfig> {
    if (this.cache === undefined) {
      this.cache = this.http.get<PublicConfig>(`${this.baseUrl}/config`).pipe(
        catchError((error: unknown) => {
          // A failed fetch must not poison the cache forever: the next form
          // attempt can retry once the API is reachable again.
          this.cache = undefined;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.cache;
  }

  clearCache(): void {
    this.cache = undefined;
  }
}

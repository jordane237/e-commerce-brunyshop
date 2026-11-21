import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, firstValueFrom, map, of } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionRestoreService {
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Restoring a session is a browser concern. During SSR there is no
   * JavaScript-readable token and each request has its own injector.
   */
  restore(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

    return firstValueFrom(
      this.auth.restoreSession().pipe(
        catchError(() => of(false)),
        map(() => undefined),
      ),
    );
  }
}

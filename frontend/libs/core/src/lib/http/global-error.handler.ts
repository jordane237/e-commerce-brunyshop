import { isPlatformBrowser } from '@angular/common';
import { ErrorHandler, inject, Injectable, PLATFORM_ID } from '@angular/core';

import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toast = inject(ToastService);

  handleError(error: unknown): void {
    if (isPlatformBrowser(this.platformId)) {
      this.toast.error('Une erreur est survenue. Réessayez.');
    }
    // Keep the technical detail in the browser console for diagnostics, never
    // in the user-facing message.
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

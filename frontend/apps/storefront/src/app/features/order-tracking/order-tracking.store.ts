import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { OrdersApi, type TrackOrderResponse } from '@bruny/data-access';

export interface OrderTrackingState {
  loading: boolean;
  error: string | null;
  result: TrackOrderResponse | null;
}

@Injectable({ providedIn: 'root' })
export class OrderTrackingStore {
  private readonly ordersApi = inject(OrdersApi);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _result = signal<TrackOrderResponse | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly result = this._result.asReadonly();
  readonly found = computed(() => this._result()?.found === true);
  readonly order = computed(() => this._result()?.order ?? null);
  readonly isEmpty = computed(() => this._result() !== null && this._result()!.found !== true);

  async track(reference: string, phone: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._result.set(null);
    try {
      const response = await firstValueFrom(this.ordersApi.track({ reference, phone }));
      this._result.set(response);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      if (httpErr?.status === 429) {
        this._error.set('Trop de tentatives. Patientez quelques minutes avant de réessayer.');
      } else {
        this._error.set(
          'Impossible de vérifier votre commande. Vérifiez votre connexion et réessayez.',
        );
      }
      this._result.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  reset(): void {
    this._result.set(null);
    this._error.set(null);
    this._loading.set(false);
  }
}

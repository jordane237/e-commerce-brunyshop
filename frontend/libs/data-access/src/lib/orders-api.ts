import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { paths } from '../generated/api-types';
import { API_BASE_URL } from './catalog-api';

type CreateOrderBody = NonNullable<
  paths['/api/v1/orders']['post']['requestBody']
>['content']['application/json'];

export type CreateOrderResponse =
  paths['/api/v1/orders']['post']['responses']['201']['content']['application/json'];

/**
 * Client typé de `POST /api/v1/orders` (ORD-01).
 *
 * Préparé pour le tunnel de commande (P11) : expose le contrat sans l'activer
 * dans l'UI tant que le checkout n'est pas livré.
 */
@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  create(payload: CreateOrderBody, idempotencyKey: string): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/orders`, payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
}

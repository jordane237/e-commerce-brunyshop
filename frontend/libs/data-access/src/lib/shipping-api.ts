import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from './catalog-api';

/** Zone de livraison exposée par `GET /shipping/zones` (ORD-03). */
export interface DeliveryZoneDto {
  id: string;
  name: string;
  cities: string[];
  /** Frais en XAF entier, décidés côté serveur. */
  fee: number;
  /** Délai estimé en jours ouvrés. */
  estimatedDays: number;
}

/**
 * Lecture des zones de livraison.
 *
 * SHP-01 remplacera cet appel par un devis complet ; d'ici là, ces valeurs
 * seedées sont la seule source réelle de frais et de délais.
 */
@Injectable({ providedIn: 'root' })
export class ShippingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getZones(): Observable<DeliveryZoneDto[]> {
    return this.http.get<DeliveryZoneDto[]>(`${this.baseUrl}/shipping/zones`);
  }
}

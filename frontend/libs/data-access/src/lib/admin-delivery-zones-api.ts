import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './catalog-api';

export type DeliveryMode = 'HOME' | 'RELAY' | 'PICKUP';

export interface AdminDeliveryZone {
  id: string;
  name: string;
  description: string | null;
  cities: string[];
  fee: number;
  estimatedDays: number;
  modes: DeliveryMode[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDeliveryZoneFilters {
  search?: string;
  isActive?: boolean;
  mode?: DeliveryMode;
}

export interface CreateDeliveryZonePayload {
  name: string;
  description?: string | null;
  cities: string[];
  fee: number;
  estimatedDays: number;
  modes: DeliveryMode[];
  isActive?: boolean;
}

export type UpdateDeliveryZonePayload = Partial<CreateDeliveryZonePayload>;

@Injectable({ providedIn: 'root' })
export class AdminDeliveryZonesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(filters: AdminDeliveryZoneFilters = {}): Observable<AdminDeliveryZone[]> {
    let params: Record<string, string> = {};
    if (filters.search) params = { ...params, search: filters.search };
    if (filters.isActive !== undefined) params = { ...params, isActive: String(filters.isActive) };
    if (filters.mode) params = { ...params, mode: filters.mode };
    return this.http.get<AdminDeliveryZone[]>(`${this.baseUrl}/admin/delivery-zones`, { params });
  }

  get(id: string): Observable<AdminDeliveryZone> {
    return this.http.get<AdminDeliveryZone>(
      `${this.baseUrl}/admin/delivery-zones/${encodeURIComponent(id)}`,
    );
  }

  create(payload: CreateDeliveryZonePayload): Observable<AdminDeliveryZone> {
    return this.http.post<AdminDeliveryZone>(`${this.baseUrl}/admin/delivery-zones`, payload);
  }

  update(id: string, payload: UpdateDeliveryZonePayload): Observable<AdminDeliveryZone> {
    return this.http.patch<AdminDeliveryZone>(
      `${this.baseUrl}/admin/delivery-zones/${encodeURIComponent(id)}`,
      payload,
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/delivery-zones/${encodeURIComponent(id)}`);
  }
}

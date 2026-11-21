import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './catalog-api';

export interface StockAlert {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  threshold: number;
  status: 'LOW' | 'OUT';
  lowStockAlertSentAt: string | null;
}

export interface StockAlertsPage {
  data: StockAlert[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    lowCount: number;
    outCount: number;
  };
}

export interface StockAlertsFilters {
  page?: number;
  limit?: number;
  threshold?: number;
  productId?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminStockApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(filters: StockAlertsFilters = {}): Observable<StockAlertsPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<StockAlertsPage>(`${this.baseUrl}/admin/stock/alerts`, { params });
  }
}

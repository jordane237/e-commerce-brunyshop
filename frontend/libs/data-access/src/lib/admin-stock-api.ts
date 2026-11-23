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

export type StockAdjustmentMotif = 'RECEPTION' | 'INVENTAIRE' | 'CASSE' | 'RETOUR' | 'AUTRE';

export interface AdminStockVariant {
  [key: string]: unknown;
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  productSlug: string;
  categoryId: string;
  categoryName: string;
  size: string;
  color: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  stockStatus: 'OUT' | 'LOW' | 'IN_STOCK';
}

export interface AdminStockVariantsPage {
  data: AdminStockVariant[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminStockVariantsFilters {
  categoryId?: string;
  stockStatus?: 'all' | 'out' | 'low' | 'in_stock';
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdjustStockPayload {
  newStock: number;
  motif: StockAdjustmentMotif;
  notes?: string;
}

export interface AdjustStockResponse {
  variantId: string;
  before: number;
  after: number;
  delta: number;
  motif: StockAdjustmentMotif;
  movementId: string;
  adjustedAt: string;
}

export interface StockMovementItem {
  id: string;
  variantId: string;
  variantSku: string;
  productName: string;
  size: string;
  color: string;
  delta: number;
  reason: string;
  motif: StockAdjustmentMotif | null;
  notes: string | null;
  before: number;
  after: number;
  userId: string;
  userName: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface StockMovementsPage {
  data: StockMovementItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface StockMovementsFilters {
  variantId?: string;
  from?: string;
  to?: string;
  motif?: StockAdjustmentMotif;
  page?: number;
  limit?: number;
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

  listVariants(filters: AdminStockVariantsFilters = {}): Observable<AdminStockVariantsPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<AdminStockVariantsPage>(`${this.baseUrl}/admin/stock/variants`, {
      params,
    });
  }

  adjustStock(variantId: string, payload: AdjustStockPayload): Observable<AdjustStockResponse> {
    return this.http.post<AdjustStockResponse>(
      `${this.baseUrl}/admin/variants/${encodeURIComponent(variantId)}/stock-adjust`,
      payload,
    );
  }

  listMovements(filters: StockMovementsFilters = {}): Observable<StockMovementsPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<StockMovementsPage>(`${this.baseUrl}/admin/stock-movements`, { params });
  }
}

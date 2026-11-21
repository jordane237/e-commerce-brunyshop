import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './catalog-api';

export type AdminProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AdminProductStockFilter = 'in' | 'low' | 'out';
export type AdminProductSort = 'updatedAt' | 'name' | 'price' | 'stock';
export type AdminProductOrder = 'asc' | 'desc';

export interface AdminProductListItem {
  [key: string]: unknown;
  id: string;
  name: string;
  slug: string;
  status: AdminProductStatus;
  basePrice: number;
  promoPrice: number | null;
  image: { url: string; alt: string | null } | null;
  category: { id: string; name: string };
  brand: { id: string; name: string };
  totalStock: number;
  availableStock: number;
  sku: string | null;
  updatedAt: string;
}

export interface AdminProductsPage {
  items: AdminProductListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminProductsFilters {
  search?: string;
  status?: AdminProductStatus;
  categoryId?: string;
  stock?: AdminProductStockFilter;
  sort?: AdminProductSort;
  order?: AdminProductOrder;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminProductsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(filters: AdminProductsFilters = {}): Observable<AdminProductsPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<AdminProductsPage>(`${this.baseUrl}/admin/products`, { params });
  }

  updateStatus(
    id: string,
    status: AdminProductStatus,
    options?: { skipToast?: boolean },
  ): Observable<unknown> {
    const headers = options?.skipToast ? { 'X-Skip-Error-Toast': '1' } : undefined;
    return this.http.patch(
      `${this.baseUrl}/admin/products/${encodeURIComponent(id)}`,
      { status },
      { headers },
    );
  }

  archive(id: string, options?: { skipToast?: boolean }): Observable<void> {
    const headers = options?.skipToast ? { 'X-Skip-Error-Toast': '1' } : undefined;
    return this.http.delete<void>(`${this.baseUrl}/admin/products/${encodeURIComponent(id)}`, {
      headers,
    });
  }
}

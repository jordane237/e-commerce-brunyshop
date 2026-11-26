import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

export interface AdminProductVariant {
  id: string;
  sku: string;
  color: string;
  size: string;
  price: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  archivedAt: string | null;
  orderCount: number;
  version: number;
}

export interface AdminProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  variantColor: string | null;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: AdminProductStatus;
  basePrice: number;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  effectivePrice: number;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  brandId: string;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null };
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants: AdminProductVariant[];
  images: AdminProductImage[];
}

export interface ProductVariantPayload {
  color: string;
  size: string;
  sku?: string;
  price?: number;
  stock: number;
  lowStockThreshold?: number;
}

export interface ProductVariantUpdatePayload extends ProductVariantPayload {
  id?: string;
}

export interface ProductImagePayload {
  url: string;
  alt?: string;
  position?: number;
  variantColor?: string;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description: string;
  categoryId: string;
  brandId: string;
  status?: AdminProductStatus;
  basePrice: number;
  promoPrice?: number;
  promoStart?: string;
  promoEnd?: string;
  seoTitle?: string;
  seoDescription?: string;
  images?: ProductImagePayload[];
  variants: ProductVariantPayload[];
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  status?: AdminProductStatus;
  basePrice?: number;
  promoPrice?: number | null;
  promoStart?: string | null;
  promoEnd?: string | null;
  seoTitle?: string;
  seoDescription?: string;
}

export interface DuplicateProductPayload {
  name?: string;
  slug?: string;
  copyImages?: boolean;
  copyVariants?: boolean;
  resetStock?: boolean;
}

const SILENT_HEADERS = new HttpHeaders({ 'X-Skip-Error-Toast': 'true' });

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

  get(id: string): Observable<AdminProductDetail> {
    return this.http.get<AdminProductDetail>(
      `${this.baseUrl}/admin/products/${encodeURIComponent(id)}`,
    );
  }

  create(payload: CreateProductPayload): Observable<AdminProductDetail> {
    return this.http.post<AdminProductDetail>(`${this.baseUrl}/admin/products`, payload, {
      headers: SILENT_HEADERS,
    });
  }

  update(
    id: string,
    payload: UpdateProductPayload,
    options?: { skipToast?: boolean },
  ): Observable<AdminProductDetail> {
    const headers = options?.skipToast ? SILENT_HEADERS : undefined;
    return this.http.patch<AdminProductDetail>(
      `${this.baseUrl}/admin/products/${encodeURIComponent(id)}`,
      payload,
      { headers },
    );
  }

  replaceVariants(
    id: string,
    variants: ProductVariantUpdatePayload[],
  ): Observable<AdminProductDetail> {
    return this.http.put<AdminProductDetail>(
      `${this.baseUrl}/admin/products/${encodeURIComponent(id)}/variants`,
      { variants },
      { headers: SILENT_HEADERS },
    );
  }

  duplicate(id: string, payload: DuplicateProductPayload): Observable<AdminProductDetail> {
    return this.http.post<AdminProductDetail>(
      `${this.baseUrl}/admin/products/${encodeURIComponent(id)}/duplicate`,
      payload,
      { headers: SILENT_HEADERS },
    );
  }

  updateStatus(
    id: string,
    status: AdminProductStatus,
    options?: { skipToast?: boolean },
  ): Observable<AdminProductDetail> {
    const headers = options?.skipToast ? SILENT_HEADERS : undefined;
    return this.http.patch<AdminProductDetail>(
      `${this.baseUrl}/admin/products/${encodeURIComponent(id)}`,
      { status },
      { headers },
    );
  }

  archive(id: string, options?: { skipToast?: boolean }): Observable<void> {
    const headers = options?.skipToast ? SILENT_HEADERS : undefined;
    return this.http.delete<void>(`${this.baseUrl}/admin/products/${encodeURIComponent(id)}`, {
      headers,
    });
  }
}

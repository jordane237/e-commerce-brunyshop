import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface CatalogVariant {
  id: string;
  sku: string;
  color: string;
  size: string;
  price: number | null;
  stock: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null };
  images: Array<{ id: string; url: string; alt: string | null; position: number }>;
  variants: CatalogVariant[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  q?: string;
}

export interface ProductPage {
  items: CatalogProduct[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  position: number;
  parent: { id: string; name: string; slug: string } | null;
  children: Array<{ id: string; name: string; slug: string; position: number }>;
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:4000/api/v1',
});

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(filters: ProductFilters = {}): Observable<ProductPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<ProductPage>(`${this.baseUrl}/products`, { params });
  }

  get(slug: string): Observable<CatalogProduct> {
    return this.http.get<CatalogProduct>(`${this.baseUrl}/products/${encodeURIComponent(slug)}`);
  }

  categories(): Observable<CatalogCategory[]> {
    return this.http.get<CatalogCategory[]>(`${this.baseUrl}/categories`);
  }
}

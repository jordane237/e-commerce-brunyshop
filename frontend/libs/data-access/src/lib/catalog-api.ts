import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { paths } from '../generated/api-types';

// Enum de tri repris du contrat généré : renommer une valeur côté backend casse
// la compilation ici après `pnpm api:generate` (TEC-09 CA2).
type ProductListQuery = NonNullable<paths['/api/v1/products']['get']['parameters']['query']>;
export type ProductSort = NonNullable<ProductListQuery['sort']>;

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

// Fiche produit (CAT-03) : le stock brut n'existe pas côté API, seul
// `availableStock` (= stock - reservedStock) est exposé.
export interface CatalogImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  variantColor: string | null;
}

export interface CatalogDetailVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  effectivePrice: number;
  availableStock: number;
  isAvailable: boolean;
}

export interface CatalogColor {
  color: string;
  slug: string;
  images: CatalogImage[];
  availableSizes: string[];
  hasStock: boolean;
}

export interface CatalogSize {
  size: string;
  availableStock: number;
  isAvailable: boolean;
  isLowStock: boolean;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  effectivePrice: number;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  isPromoActive: boolean;
  inStock: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null };
  images: CatalogImage[];
}

export interface CatalogProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  basePrice: number;
  effectivePrice: number;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  isPromoActive: boolean;
  inStock: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null };
  images: CatalogImage[];
  colors: CatalogColor[];
  sizes: CatalogSize[];
  variants: CatalogDetailVariant[];
  similarProducts: CatalogProductSummary[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
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

  get(slug: string): Observable<CatalogProductDetail> {
    return this.http.get<CatalogProductDetail>(
      `${this.baseUrl}/products/${encodeURIComponent(slug)}`,
    );
  }

  categories(): Observable<CatalogCategory[]> {
    return this.http.get<CatalogCategory[]>(`${this.baseUrl}/categories`);
  }
}

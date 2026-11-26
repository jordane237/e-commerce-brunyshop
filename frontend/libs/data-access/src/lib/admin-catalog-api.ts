import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './catalog-api';

export interface AdminCategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface AdminBrandOption {
  id: string;
  name: string;
  slug: string;
}

export interface AdminCatalogOptions {
  categories: AdminCategoryOption[];
  brands: AdminBrandOption[];
}

@Injectable({ providedIn: 'root' })
export class AdminCatalogApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  options(): Observable<AdminCatalogOptions> {
    return this.http.get<AdminCatalogOptions>(`${this.baseUrl}/admin/catalog/options`);
  }
}

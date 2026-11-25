import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './catalog-api';

export interface PresignUploadPayload {
  productSlug: string;
  variantColor?: string;
  contentType: string;
  declaredSize: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
  method: 'PUT';
  headers: Record<string, string>;
}

export interface ConfirmUploadPayload {
  key: string;
  productSlug: string;
  variantColor?: string;
  position?: number;
  alt?: string;
}

export interface MediaImageResponse {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string | null;
  position: number;
  variantColor: string | null;
}

const SILENT_HEADERS = new HttpHeaders({ 'X-Skip-Error-Toast': 'true' });

@Injectable({ providedIn: 'root' })
export class AdminMediaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  presign(payload: PresignUploadPayload): Observable<PresignUploadResponse> {
    return this.http.post<PresignUploadResponse>(`${this.baseUrl}/admin/media/presign`, payload, {
      headers: SILENT_HEADERS,
    });
  }

  confirm(payload: ConfirmUploadPayload): Observable<MediaImageResponse> {
    return this.http.post<MediaImageResponse>(`${this.baseUrl}/admin/media/confirm`, payload, {
      headers: SILENT_HEADERS,
    });
  }

  deleteImage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/media/images/${encodeURIComponent(id)}`, {
      headers: SILENT_HEADERS,
    });
  }

  reorder(
    productId: string,
    order: Array<{ id: string; position: number }>,
  ): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(
      `${this.baseUrl}/admin/media/images/reorder`,
      { productId, order },
      { headers: SILENT_HEADERS },
    );
  }
}

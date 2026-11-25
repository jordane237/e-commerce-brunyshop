import { HttpClient, HttpBackend, HttpEventType, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, filter, map } from 'rxjs';

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

export interface MediaConfig {
  maxFileSizeBytes: number;
  maxImagesPerProduct: number;
  presignExpiresSeconds: number;
  allowedMimeTypes: string[];
}

export interface UpdateProductImagePayload {
  alt?: string | null;
  variantColor?: string | null;
}

const SILENT_HEADERS = new HttpHeaders({ 'X-Skip-Error-Toast': 'true' });

@Injectable({ providedIn: 'root' })
export class AdminMediaApi {
  private readonly http = inject(HttpClient);
  private readonly backend = inject(HttpBackend);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly storageHttp = new HttpClient(this.backend);

  config(): Observable<MediaConfig> {
    return this.http.get<MediaConfig>(`${this.baseUrl}/admin/media/config`, {
      headers: SILENT_HEADERS,
    });
  }

  /**
   * PUT direct vers l'URL signée. Le client brut contourne volontairement les
   * intercepteurs applicatifs : aucun jeton d'API ni toast global ne doit fuiter
   * vers le stockage. La progression correspond aux octets réellement envoyés.
   */
  upload(presigned: PresignUploadResponse, file: File): Observable<number> {
    return this.storageHttp
      .put(presigned.uploadUrl, file, {
        headers: new HttpHeaders(presigned.headers),
        reportProgress: true,
        observe: 'events',
        withCredentials: false,
      })
      .pipe(
        filter(
          (event) =>
            event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response,
        ),
        map((event) => {
          if (event.type !== HttpEventType.UploadProgress) return 100;
          return event.total ? Math.round((100 * event.loaded) / event.total) : 0;
        }),
      );
  }

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

  updateImage(id: string, payload: UpdateProductImagePayload): Observable<MediaImageResponse> {
    return this.http.patch<MediaImageResponse>(
      `${this.baseUrl}/admin/media/images/${encodeURIComponent(id)}/metadata`,
      payload,
      { headers: SILENT_HEADERS },
    );
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

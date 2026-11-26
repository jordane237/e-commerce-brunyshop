import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { ContactDto, ContactResponseDto } from './api-contracts';
import { API_BASE_URL } from './catalog-api';

/** Le honeypot est volontairement absent du contrat OpenAPI public. */
export type ContactRequest = ContactDto & { _honey?: string };

/** Client typé de l'endpoint public de contact (MKT-02). */
@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly skipErrorToast = new HttpHeaders({ 'X-Skip-Error-Toast': 'true' });

  submit(payload: ContactRequest): Observable<ContactResponseDto> {
    return this.http.post<ContactResponseDto>(`${this.baseUrl}/contact`, payload, {
      headers: this.skipErrorToast,
    });
  }
}

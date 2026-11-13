import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { CartValidationResponseDto, ValidateCartDto } from './api-contracts';
import { API_BASE_URL } from './catalog-api';

/** Client typé du seul endpoint panier disponible (CRT-01). */
@Injectable({ providedIn: 'root' })
export class CartApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  validate(payload: ValidateCartDto): Observable<CartValidationResponseDto> {
    return this.http.post<CartValidationResponseDto>(`${this.baseUrl}/cart/validate`, payload);
  }
}

import { HttpErrorResponse } from '@angular/common/http';

export interface ApiErrorBody {
  code?: string;
  message?: string | string[];
  requestId?: string;
  statusCode?: number;
  errors?: Array<{ field?: string; message?: string }>;
}

export function readApiError(error: unknown): ApiErrorBody | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const body = error.error;
  return typeof body === 'object' && body !== null ? (body as ApiErrorBody) : null;
}

export function readApiErrorMessage(error: unknown, fallback: string): string {
  const message = readApiError(error)?.message;
  if (Array.isArray(message)) {
    const joined = message.filter((item) => item.trim() !== '').join('. ');
    return joined || fallback;
  }
  return typeof message === 'string' && message.trim() !== '' ? message : fallback;
}

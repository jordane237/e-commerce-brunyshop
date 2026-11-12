import { HttpInterceptorFn } from '@angular/common/http';

export const requestIdInterceptor: HttpInterceptorFn = (request, next) => {
  const requestId =
    globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return next(request.clone({ setHeaders: { 'X-Request-Id': requestId } }));
};

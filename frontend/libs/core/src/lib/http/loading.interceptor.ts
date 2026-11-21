import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.headers.has('X-Skip-Loading')) return next(request);

  const loading = inject(LoadingService);
  loading.increment();
  return next(request).pipe(finalize(() => loading.decrement()));
};

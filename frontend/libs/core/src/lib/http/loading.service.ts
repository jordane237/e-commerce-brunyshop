import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly counter = signal(0);

  readonly isLoading = computed(() => this.counter() > 0);

  increment(): void {
    this.counter.update((count) => count + 1);
  }

  decrement(): void {
    this.counter.update((count) => Math.max(0, count - 1));
  }
}

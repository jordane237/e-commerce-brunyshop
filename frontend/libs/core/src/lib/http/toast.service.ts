import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface AppToast {
  id: number;
  message: string;
  variant: ToastVariant;
  title?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly state = signal<AppToast[]>([]);
  private nextId = 0;

  readonly toasts = this.state.asReadonly();
  readonly current = computed(() => this.state()[0] ?? null);

  error(message: string, title?: string): void {
    this.push('error', message, title);
  }

  success(message: string, title?: string): void {
    this.push('success', message, title);
  }

  warning(message: string, title?: string): void {
    this.push('warning', message, title);
  }

  info(message: string, title?: string): void {
    this.push('info', message, title);
  }

  dismiss(id: number): void {
    this.state.update((items) => items.filter((item) => item.id !== id));
  }

  dismissCurrent(): void {
    const current = this.current();
    if (current !== null) this.dismiss(current.id);
  }

  clear(): void {
    this.state.set([]);
  }

  private push(variant: ToastVariant, message: string, title?: string): void {
    // A toast is a DOM concern: SSR must not accumulate or render one.
    if (!isPlatformBrowser(this.platformId) || message.trim() === '') return;
    this.nextId += 1;
    this.state.update((items) => [
      ...items,
      {
        id: this.nextId,
        message,
        variant,
        ...(title !== undefined ? { title } : {}),
        duration: variant === 'error' ? 8000 : 5000,
      },
    ]);
  }
}

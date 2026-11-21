import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  PLATFORM_ID,
  type SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const ICONS: Record<ToastVariant, IconName> = {
  success: 'check-circle',
  error: 'alert',
  warning: 'alert',
  info: 'info',
};

@Component({
  selector: 'bruny-toast',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent implements OnChanges {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private timer?: ReturnType<typeof setTimeout>;
  private readonly messageState = signal('');
  private readonly dismissedState = signal(false);

  @Input() variant: ToastVariant = 'error';
  @Input() title = '';
  @Input() closable = true;
  @Input() duration = 0;

  @Input()
  set message(value: string) {
    this.messageState.set(value ?? '');
    this.dismissedState.set(false);
  }
  get message(): string {
    return this.messageState();
  }

  @Output() closed = new EventEmitter<void>();

  readonly visible = computed(() => this.messageState().length > 0 && !this.dismissedState());
  readonly icon = computed(() => ICONS[this.variant]);
  readonly isAssertive = computed(() => this.variant === 'error' || this.variant === 'warning');

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['duration']) {
      this.scheduleDismiss();
    }
  }

  close(): void {
    this.clearTimer();
    this.dismissedState.set(true);
    this.closed.emit();
  }

  private scheduleDismiss(): void {
    this.clearTimer();
    if (this.duration <= 0 || !isPlatformBrowser(this.platformId)) return;
    this.timer = setTimeout(() => this.close(), this.duration);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}

import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  type SimpleChanges,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'bruny-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input({ required: true }) title = '';
  @Input() id = 'bs-modal';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() closeOnBackdrop = true;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  private previousFocus: HTMLElement | null = null;
  private previousOverflow = '';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: string,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) this.activate();
      else this.deactivate();
    }
  }

  ngOnDestroy(): void {
    this.restorePage();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
    this.deactivate();
  }

  onBackdrop(event: MouseEvent): void {
    if (!this.closeOnBackdrop) return;
    if (event.target === event.currentTarget) this.close();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = this.focusables();
    const dialog = this.dialog?.nativeElement;
    if (!dialog) return;

    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this.document.activeElement;

    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private activate(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.previousFocus = this.document.activeElement as HTMLElement | null;
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    queueMicrotask(() => {
      const dialog = this.dialog?.nativeElement;
      if (!dialog) return;
      const preferred = dialog.querySelector<HTMLElement>('[autofocus]');
      (preferred ?? this.focusables()[0] ?? dialog).focus();
    });
  }

  private deactivate(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.restorePage();
    this.previousFocus?.focus?.();
    this.previousFocus = null;
  }

  private restorePage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.body.style.overflow = this.previousOverflow;
  }

  private focusables(): HTMLElement[] {
    const dialog = this.dialog?.nativeElement;
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null,
    );
  }
}

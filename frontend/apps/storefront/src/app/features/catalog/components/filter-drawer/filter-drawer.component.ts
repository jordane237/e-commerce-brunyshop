import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  PLATFORM_ID,
  ViewChild,
  effect,
  untracked,
} from '@angular/core';
import { CatalogFacets } from '@bruny/data-access';
import { CatalogFilters } from '../../catalog-query';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Tiroir bottom-sheet des filtres sur mobile. Les filtres s'appliquent en
 * direct (l'URL est mise à jour par la page) ; le bouton de pied confirme et
 * referme le tiroir.
 *
 * Le tiroir ne rend son contenu qu'à l'ouverture : pas de doublon d'ids avec
 * la barre latérale desktop et pas de piège au clavier quand il est fermé.
 */
@Component({
  selector: 'bruny-filter-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilterSidebarComponent],
  templateUrl: './filter-drawer.component.html',
  styleUrl: './filter-drawer.component.scss',
})
export class FilterDrawerComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);

  readonly open = input(false);
  readonly filters = input.required<CatalogFilters>();
  readonly facets = input<CatalogFacets | null>(null);
  readonly total = input(0);

  readonly closed = output<void>();
  readonly filtersChange = output<Partial<CatalogFilters>>();
  readonly reset = output<void>();

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  private active = false;
  private previousFocus: HTMLElement | null = null;
  private previousOverflow = '';

  constructor() {
    effect(() => {
      const open = this.open();
      if (!this.browser) return;
      untracked(() => (open ? this.activate() : this.deactivate()));
    });
  }

  ngOnDestroy(): void {
    this.deactivate();
  }

  close(): void {
    this.closed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.open()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = this.focusables();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = this.document.activeElement;

    if (event.shiftKey && (current === first || !this.dialog?.nativeElement.contains(current))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private activate(): void {
    if (this.active) return;
    this.active = true;
    this.previousFocus =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    // Le contenu vient d'être rendu par @if : on attend le prochain tour.
    setTimeout(() => this.closeButton?.nativeElement.focus(), 0);
  }

  private deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.document.body.style.overflow = this.previousOverflow;
    this.previousFocus?.focus();
    this.previousFocus = null;
  }

  private focusables(): HTMLElement[] {
    const dialog = this.dialog?.nativeElement;
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
  }
}

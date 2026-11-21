import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  input,
  signal,
} from '@angular/core';

export interface TocSection {
  /** Ancre kebab-case, identique à l'`id` de la section cible. */
  readonly id: string;
  readonly title: string;
  readonly level: 2 | 3;
}

@Component({
  selector: 'bruny-table-of-contents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-of-contents.component.html',
  styleUrl: './table-of-contents.component.scss',
})
export class TableOfContentsComponent {
  readonly sections = input.required<readonly TocSection[]>();
  readonly activeSection = signal<string | null>(null);

  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof IntersectionObserver !== 'undefined') {
      queueMicrotask(() => this.observeSections());
    }
  }

  onSectionClick(id: string, event: Event): void {
    event.preventDefault();
    const element = this.documentElement(id);
    if (element === null) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    element.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    history.replaceState(null, '', `#${id}`);
    this.activeSection.set(id);

    element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
  }

  private documentElement(id: string): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    return document.getElementById(id);
  }

  private observeSections(): void {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.activeSection.set(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    for (const section of this.sections()) {
      const element = this.documentElement(section.id);
      if (element !== null) this.observer.observe(element);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

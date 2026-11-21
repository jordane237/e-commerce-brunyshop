import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Pagination du catalogue :
 * - mobile : « Voir plus » ajoute la page suivante à la liste ;
 * - desktop : pages numérotées, `aria-current` sur la page active.
 */
@Component({
  selector: 'bruny-catalog-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pages = input.required<number>();
  readonly total = input.required<number>();
  readonly limit = input.required<number>();
  readonly loadingMore = input(false);

  readonly pageChange = output<number>();
  readonly loadMore = output<void>();

  readonly hasMore = computed(() => this.page() < this.pages());
  readonly shown = computed(() => Math.min(this.page() * this.limit(), this.total()));
  readonly visiblePages = computed<Array<number | 'gap'>>(() => {
    const pages = this.pages();
    const current = this.page();
    if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

    const kept = new Set(
      [1, pages, current - 1, current, current + 1].filter((value) => value >= 1 && value <= pages),
    );
    const sorted = [...kept].sort((left, right) => left - right);
    const result: Array<number | 'gap'> = [];
    sorted.forEach((value, index) => {
      if (index > 0 && value - sorted[index - 1] > 1) result.push('gap');
      result.push(value);
    });
    return result;
  });
}

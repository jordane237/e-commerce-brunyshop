import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CatalogCategory } from '@bruny/data-access';
import { SkeletonComponent } from '@bruny/ui';

@Component({
  selector: 'bruny-categories-pills',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SkeletonComponent],
  templateUrl: './categories-pills.component.html',
  styleUrl: './categories-pills.component.scss',
})
export class CategoriesPillsComponent {
  readonly categories = input<CatalogCategory[] | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retry = output<void>();

  readonly placeholders = [1, 2, 3, 4, 5];
}

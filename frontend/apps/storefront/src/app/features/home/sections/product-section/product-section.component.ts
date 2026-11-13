import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '@bruny/data-access';
import { ProductCardComponent, SkeletonComponent } from '@bruny/ui';

/**
 * Section produit réutilisable (Nouveautés / Meilleures Ventes / Promotions).
 * Le composant est purement présentationnel : les données viennent de
 * `HomeDataService`, ce qui évite de dupliquer les appels API.
 */
@Component({
  selector: 'bruny-product-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCardComponent, SkeletonComponent],
  templateUrl: './product-section.component.html',
  styleUrl: './product-section.component.scss',
})
export class ProductSectionComponent {
  readonly title = input.required<string>();
  readonly products = input<CatalogProduct[] | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly emptyMessage = input('Aucun produit pour le moment.');
  readonly viewMoreLink = input<string | null>('/boutique');
  readonly retry = output<void>();
  readonly add = output<CatalogProduct>();

  readonly sectionId = computed(
    () =>
      `home-section-${this.title()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`,
  );

  readonly isEmpty = computed(
    () => !this.loading() && !this.error() && this.products()?.length === 0,
  );

  readonly placeholders = [1, 2, 3, 4];
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CatalogProduct } from '@bruny/data-access';
import { ProductCardComponent, SkeletonComponent } from '@bruny/ui';

/** Grille responsive : 2 colonnes mobile, 3 tablette, 4 desktop. */
@Component({
  selector: 'bruny-product-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent, SkeletonComponent],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.scss',
})
export class ProductGridComponent {
  readonly products = input.required<CatalogProduct[]>();
  readonly loading = input(false);
  readonly add = output<CatalogProduct>();

  readonly placeholders = [1, 2, 3, 4, 5, 6, 7, 8];
}

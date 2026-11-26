import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '@bruny/ui';

@Component({
  selector: 'app-products-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectComponent],
  templateUrl: './products-filters.component.html',
  styleUrl: './products-filters.component.scss',
})
export class ProductsFiltersComponent {
  @Input() categories: { id: string; name: string }[] = [];
  @Input() status: string | undefined = undefined;
  @Input() categoryId: string | undefined = undefined;
  @Input() stock: string | undefined = undefined;

  @Output() statusChange = new EventEmitter<string | undefined>();
  @Output() categoryChange = new EventEmitter<string | undefined>();
  @Output() stockChange = new EventEmitter<string | undefined>();
  @Output() reset = new EventEmitter<void>();

  readonly statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'PUBLISHED', label: 'Publié' },
    { value: 'ARCHIVED', label: 'Archivé' },
  ];

  readonly stockOptions = [
    { value: '', label: 'Tout le stock' },
    { value: 'in', label: 'En stock' },
    { value: 'low', label: 'Stock faible' },
    { value: 'out', label: 'Rupture' },
  ];

  get categoryOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Toutes les catégories' },
      ...this.categories.map((c) => ({ value: c.id, label: c.name })),
    ];
  }
}

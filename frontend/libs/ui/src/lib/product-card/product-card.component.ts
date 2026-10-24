import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '@bruny/data-access';
import { effectiveProductPrice } from '@bruny/util';
import { BadgeComponent } from '../badge/badge.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { PriceTagComponent } from '../price-tag/price-tag.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'bruny-product-card',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterLink,
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    PriceTagComponent,
    SkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: CatalogProduct;
  @Input() loading = false;
  @Input() showSizes = true;
  @Input() showAdd = false;
  @Input() isNew = false;
  @Input() favorite = false;
  @Output() add = new EventEmitter<void>();
  @Output() favoriteChange = new EventEmitter<boolean>();

  get price(): number {
    return effectiveProductPrice(this.product);
  }

  get compareAt(): number | null {
    return this.price < this.product.basePrice ? this.product.basePrice : null;
  }

  get discount(): number {
    if (!this.compareAt) return 0;
    return Math.round((1 - this.price / this.compareAt) * 100);
  }

  get imageUrl(): string | null {
    return this.product.images[0]?.url ?? null;
  }

  get imageAlt(): string {
    return this.product.images[0]?.alt || this.product.name;
  }

  get availableSizes(): string[] {
    const sizes = this.product.variants
      .filter((variant) => variant.stock > 0)
      .map((variant) => variant.size);
    return [...new Set(sizes)].sort((a, b) => Number(a) - Number(b));
  }

  toggleFavorite(): void {
    this.favorite = !this.favorite;
    this.favoriteChange.emit(this.favorite);
  }

  onAdd(): void {
    this.add.emit();
  }
}
